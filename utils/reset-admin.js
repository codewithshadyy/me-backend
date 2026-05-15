/**
 * utils/reset-admin.js
 * ─────────────────────────────────────────────────────────────
 * Run this on Render (or any server) to fix admin login issues.
 *
 * Usage:
 *   node utils/reset-admin.js
 *   node utils/reset-admin.js --username=admin --password=MyNewPass123
 *
 * On Render:
 *   Go to Shell tab → node utils/reset-admin.js
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Parse CLI args ─────────────────────────────────────────
const args     = process.argv.slice(2);
const argMap   = {};
args.forEach(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  argMap[k] = v;
});

const NEW_USERNAME = argMap.username || process.env.ADMIN_USERNAME || 'admin';
const NEW_PASSWORD = argMap.password || process.env.ADMIN_PASSWORD || 'admin123';
const NEW_EMAIL    = argMap.email    || process.env.ADMIN_EMAIL    || 'admin@portfolio.dev';
const MONGO_URI    = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_db';

async function resetAdmin() {
  console.log('\n🔧 Admin Reset Tool');
  console.log('──────────────────────────────────');
  console.log('MongoDB URI:', MONGO_URI.replace(/:\/\/.*@/, '://***@'));
  console.log('Username   :', NEW_USERNAME);
  console.log('Password   :', NEW_PASSWORD);
  console.log('Email      :', NEW_EMAIL);
  console.log('──────────────────────────────────\n');

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  const db = mongoose.connection.db;

  // ── Direct low-level upsert — bypasses Mongoose middleware ──
  // This is intentional: we hash the password ourselves so it
  // is NOT double-hashed by the pre-save hook.
  const salt         = await bcrypt.genSalt(12);
  const hashedPass   = await bcrypt.hash(NEW_PASSWORD, salt);

  const adminsCol    = db.collection('admins');
  const existing     = await adminsCol.findOne({ username: NEW_USERNAME });

  if (existing) {
    // Update existing admin
    const result = await adminsCol.updateOne(
      { username: NEW_USERNAME },
      {
        $set: {
          password      : hashedPass,
          email         : NEW_EMAIL,
          isActive      : true,
          loginAttempts : 0,
          role          : 'super_admin',
          updatedAt     : new Date(),
        },
        $unset: { lockUntil: '' },
      }
    );
    console.log('✅ Admin password UPDATED successfully');
    console.log('   Modified:', result.modifiedCount, 'document(s)');
  } else {
    // Insert fresh admin
    await adminsCol.insertOne({
      username      : NEW_USERNAME,
      email         : NEW_EMAIL,
      password      : hashedPass,
      role          : 'super_admin',
      isActive      : true,
      loginAttempts : 0,
      createdAt     : new Date(),
      updatedAt     : new Date(),
    });
    console.log('✅ Admin user CREATED successfully');
  }

  // Verify by re-fetching and comparing
  const verifyAdmin = await adminsCol.findOne({ username: NEW_USERNAME });
  const isValid     = await bcrypt.compare(NEW_PASSWORD, verifyAdmin.password);

  console.log('\n🔑 Verification:');
  console.log('   Password hash valid:', isValid ? '✅ YES' : '❌ NO — something went wrong');

  if (isValid) {
    console.log('\n🎉 Done! You can now log in with:');
    console.log('   Username:', NEW_USERNAME);
    console.log('   Password:', NEW_PASSWORD);
    console.log('\n   Login URL: https://your-domain.com/admin/index.html\n');
  } else {
    console.error('\n❌ Verification failed. Run the script again.\n');
    process.exit(1);
  }

  await mongoose.disconnect();
  process.exit(0);
}

resetAdmin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});