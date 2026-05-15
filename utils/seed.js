/**
 * utils/seed.js — Database seeder
 * Run: npm run seed
 * Reset admin: node utils/reset-admin.js
 */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const Admin      = require('../models/Admin');
const Project    = require('../models/Project');
const Experience = require('../models/Experience');

const MONGO_URI = process.env.MONGODB_URI;

const PROJECTS = [
  { title:'FinPay API Gateway', category:'api', description:'High-throughput payment processing API handling 50k+ transactions/day with multi-currency support, fraud detection, real-time webhook delivery, and PCI-DSS compliance across 12 African markets.', shortDescription:'Payment API with fraud detection and multi-currency support.', techStack:['Python','Django','DRF','PostgreSQL','Redis','Celery'], tags:['payments','fintech','api'], githubLink:'https://github.com', liveLink:'https://example.com', featured:true, visible:true, imageUrl:'https://picsum.photos/seed/finpay/800/500', images:['https://picsum.photos/seed/finpay/800/500'], order:1 },
  { title:'MicroAuth Service', category:'backend', description:'Production-grade JWT authentication microservice with refresh token rotation, RBAC, OAuth2 social login, and comprehensive audit logging.', shortDescription:'JWT auth microservice with RBAC and OAuth2.', techStack:['Node.js','Express','MongoDB','JWT','Redis'], tags:['auth','security','microservice'], githubLink:'https://github.com', liveLink:'https://example.com', featured:true, visible:true, imageUrl:'https://picsum.photos/seed/microauth/800/500', images:['https://picsum.photos/seed/microauth/800/500'], order:2 },
  { title:'DataSync Platform', category:'fullstack', description:'Real-time data synchronization platform with event-driven architecture and conflict resolution for enterprise teams.', shortDescription:'Real-time data sync with offline-first support.', techStack:['Python','FastAPI','PostgreSQL','WebSockets','Docker'], tags:['realtime','fullstack','enterprise'], githubLink:'https://github.com', liveLink:'https://example.com', featured:false, visible:true, imageUrl:'https://picsum.photos/seed/datasync/800/500', images:['https://picsum.photos/seed/datasync/800/500'], order:3 },
  { title:'QueryForge ORM', category:'database', description:'Zero-dependency query builder and ORM for PostgreSQL in Node.js with auto-migrations and TypeScript support.', shortDescription:'Zero-dependency PostgreSQL ORM with auto-migrations.', techStack:['TypeScript','Node.js','PostgreSQL'], tags:['orm','database','open-source'], githubLink:'https://github.com', liveLink:'', featured:false, visible:true, imageUrl:'https://picsum.photos/seed/queryforge/800/500', images:['https://picsum.photos/seed/queryforge/800/500'], order:4 },
  { title:'LogStream Analytics', category:'backend', description:'Distributed log aggregation engine ingesting 1M+ events/sec with real-time alerting and Grafana integration.', shortDescription:'Distributed log ingestion with real-time alerting.', techStack:['Python','Kafka','ClickHouse','Redis','Grafana'], tags:['analytics','distributed','monitoring'], githubLink:'https://github.com', liveLink:'', featured:true, visible:true, imageUrl:'https://picsum.photos/seed/logstream/800/500', images:['https://picsum.photos/seed/logstream/800/500'], order:5 },
  { title:'SecureVault API', category:'api', description:'End-to-end encrypted secrets management API with key rotation, HSM integration, and fine-grained access policies.', shortDescription:'Encrypted secrets management with key rotation.', techStack:['Python','Django','PostgreSQL','AES-256','AWS KMS'], tags:['security','encryption','devops'], githubLink:'https://github.com', liveLink:'https://example.com', featured:false, visible:true, imageUrl:'https://picsum.photos/seed/securevault/800/500', images:['https://picsum.photos/seed/securevault/800/500'], order:6 },
];

const EXPERIENCES = [
  { role:'Senior Backend Engineer', company:'FinPay Africa', location:'Nairobi, Kenya', employmentType:'Full-time', startDate:new Date('2023-01-15'), isCurrent:true, duration:'Jan 2023 – Present', responsibilities:['Architected payment gateway API serving 500k+ users across 12 African markets.','Reduced API response time by 65% through Redis caching and query optimization.','Led migration from monolith to microservices, improving deployment frequency 3x.','Implemented OAuth2 + JWT auth with refresh token rotation across 5 services.'], technologies:['Python','Django','DRF','PostgreSQL','Redis','Celery','Docker','AWS'], visible:true, order:1 },
  { role:'Backend Developer', company:'BuildStack Technologies', location:'Nairobi, Kenya', employmentType:'Full-time', startDate:new Date('2021-06-01'), endDate:new Date('2022-12-31'), isCurrent:false, duration:'Jun 2021 – Dec 2022', responsibilities:['Built RESTful APIs for a SaaS PM platform with 20k+ active users.','Designed multi-tenant database schema with row-level security.','Integrated Stripe, Twilio, SendGrid, and Google OAuth.','Maintained 98% uptime SLO across all production services.'], technologies:['Node.js','Express.js','MongoDB','JWT','Stripe API','SendGrid'], visible:true, order:2 },
  { role:'Junior Software Engineer', company:'DataSync Labs', location:'Nairobi, Kenya', employmentType:'Full-time', startDate:new Date('2020-08-01'), endDate:new Date('2021-05-31'), isCurrent:false, duration:'Aug 2020 – May 2021', responsibilities:['Developed data ingestion pipelines processing 2M+ records daily.','Built admin dashboards with Django and vanilla JavaScript.','Contributed to open-source ORM with 1,200+ GitHub stars.'], technologies:['Python','Django','PostgreSQL','REST APIs','JavaScript'], visible:true, order:3 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB connected\n');

    // ── Admin: use direct bcrypt to avoid double-hashing ────
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email    = process.env.ADMIN_EMAIL    || 'admin@portfolio.dev';

    const salt       = await bcrypt.genSalt(12);
    const hashedPass = await bcrypt.hash(password, salt);

    const existing = await Admin.findOne({ username });
    if (!existing) {
      // Insert directly to bypass pre-save hook (password already hashed)
      await mongoose.connection.db.collection('admins').insertOne({
        username, email, password: hashedPass,
        role: 'super_admin', isActive: true, loginAttempts: 0,
        createdAt: new Date(), updatedAt: new Date(),
      });
      console.log('✅ Admin created →', username, '/', password);
    } else {
      console.log('ℹ️  Admin exists — skipping (run reset-admin.js to reset password)');
    }

    // ── Projects ──────────────────────────────────────────
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
      await Project.insertMany(PROJECTS);
      console.log('✅ Seeded', PROJECTS.length, 'projects');
    } else {
      console.log('ℹ️  Projects exist (' + projCount + ') — skipping');
    }

    // ── Experiences ───────────────────────────────────────
    const expCount = await Experience.countDocuments();
    if (expCount === 0) {
      await Experience.insertMany(EXPERIENCES);
      console.log('✅ Seeded', EXPERIENCES.length, 'experiences');
    } else {
      console.log('ℹ️  Experiences exist (' + expCount + ') — skipping');
    }

    console.log('\n🎉 Seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();