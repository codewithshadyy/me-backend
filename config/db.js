
'use strict';

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

const OPTIONS = {
  serverSelectionTimeoutMS : 5000,
  socketTimeoutMS          : 45000,
  maxPoolSize              : 10,
  retryWrites              : true,
};

let retries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI, OPTIONS);
    retries = 0;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    retries++;
    console.error(`❌ MongoDB connection error (attempt ${retries}/${MAX_RETRIES}): ${err.message}`);
    if (retries < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(connectDB, RETRY_DELAY);
    } else {
      console.error('   Max retries reached. Running in demo/offline mode.');
    }
  }
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
  setTimeout(connectDB, RETRY_DELAY);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', false); // set true to log all queries
}

module.exports = connectDB;