
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose   = require('mongoose');
const Admin      = require('../models/Admin');
const Project    = require('../models/Project');
const Experience = require('../models/Experience');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_db';

// ── Sample Data ────────────────────────────────────────────
const PROJECTS = [
  {
    title      : 'FinPay API Gateway',
    category   : 'api',
    description: 'High-throughput payment processing API handling 50k+ transactions/day with multi-currency support, fraud detection, real-time webhook delivery, and PCI-DSS compliance across 12 African markets.',
    shortDescription: 'High-throughput payment API with fraud detection and multi-currency support.',
    techStack  : ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery', 'AWS SQS'],
    tags       : ['payments', 'fintech', 'api', 'africa'],
    githubLink : 'https://github.com',
    liveLink   : 'https://example.com',
    featured   : true,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/finpay/800/500',
    images     : ['https://picsum.photos/seed/finpay/800/500'],
    order      : 1,
    completedAt: new Date('2024-01-15'),
    metrics    : { stars: 142, forks: 23, views: 0 },
  },
  {
    title      : 'MicroAuth Service',
    category   : 'backend',
    description: 'Production-grade JWT authentication microservice with refresh token rotation, role-based access control (RBAC), OAuth2 social login, rate limiting, and comprehensive audit logging.',
    shortDescription: 'JWT auth microservice with RBAC and OAuth2 integration.',
    techStack  : ['Node.js', 'Express', 'MongoDB', 'JWT', 'Passport.js', 'Redis'],
    tags       : ['auth', 'security', 'microservice', 'jwt'],
    githubLink : 'https://github.com',
    liveLink   : 'https://example.com',
    featured   : true,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/microauth/800/500',
    images     : ['https://picsum.photos/seed/microauth/800/500'],
    order      : 2,
    completedAt: new Date('2023-11-20'),
    metrics    : { stars: 89, forks: 14, views: 0 },
  },
  {
    title      : 'DataSync Platform',
    category   : 'fullstack',
    description: 'Real-time data synchronization platform with event-driven architecture, conflict resolution, offline-first support, and collaborative editing for enterprise teams. Handles 1M+ events per day.',
    shortDescription: 'Real-time data sync with event-driven architecture and offline-first support.',
    techStack  : ['Python', 'FastAPI', 'PostgreSQL', 'WebSockets', 'React', 'Docker'],
    tags       : ['realtime', 'fullstack', 'enterprise', 'sync'],
    githubLink : 'https://github.com',
    liveLink   : 'https://example.com',
    featured   : false,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/datasync/800/500',
    images     : ['https://picsum.photos/seed/datasync/800/500'],
    order      : 3,
    completedAt: new Date('2023-09-10'),
    metrics    : { stars: 64, forks: 9, views: 0 },
  },
  {
    title      : 'QueryForge ORM',
    category   : 'database',
    description: 'Lightweight, zero-dependency query builder and ORM for PostgreSQL in Node.js. Features automatic migration generation, relation management, connection pooling, and TypeScript support.',
    shortDescription: 'Zero-dependency PostgreSQL ORM with auto-migrations for Node.js.',
    techStack  : ['TypeScript', 'Node.js', 'PostgreSQL'],
    tags       : ['orm', 'database', 'open-source', 'postgresql'],
    githubLink : 'https://github.com',
    liveLink   : '',
    featured   : false,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/queryforge/800/500',
    images     : ['https://picsum.photos/seed/queryforge/800/500'],
    order      : 4,
    completedAt: new Date('2023-07-01'),
    metrics    : { stars: 312, forks: 41, views: 0 },
  },
  {
    title      : 'LogStream Analytics',
    category   : 'backend',
    description: 'Distributed log aggregation and analytics engine capable of ingesting 1M+ events/sec with real-time alerting, anomaly detection, Grafana/Kibana integration, and multi-tenant support.',
    shortDescription: 'Distributed log ingestion engine with real-time alerting and Grafana integration.',
    techStack  : ['Python', 'Kafka', 'ClickHouse', 'Redis', 'Grafana', 'Docker'],
    tags       : ['analytics', 'distributed', 'monitoring', 'devops'],
    githubLink : 'https://github.com',
    liveLink   : '',
    featured   : true,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/logstream/800/500',
    images     : ['https://picsum.photos/seed/logstream/800/500'],
    order      : 5,
    completedAt: new Date('2024-03-05'),
    metrics    : { stars: 57, forks: 8, views: 0 },
  },
  {
    title      : 'SecureVault API',
    category   : 'api',
    description: 'End-to-end encrypted secrets management REST API with key rotation, HSM integration, fine-grained access policies, comprehensive audit logging, and HashiCorp Vault compatibility.',
    shortDescription: 'Encrypted secrets management API with key rotation and HSM integration.',
    techStack  : ['Python', 'Django', 'PostgreSQL', 'HashiCorp Vault', 'AES-256', 'AWS KMS'],
    tags       : ['security', 'encryption', 'devops', 'secrets'],
    githubLink : 'https://github.com',
    liveLink   : 'https://example.com',
    featured   : false,
    visible    : true,
    imageUrl   : 'https://picsum.photos/seed/securevault/800/500',
    images     : ['https://picsum.photos/seed/securevault/800/500'],
    order      : 6,
    completedAt: new Date('2024-02-12'),
    metrics    : { stars: 28, forks: 5, views: 0 },
  },
];

const EXPERIENCES = [
  {
    role           : 'Senior Backend Engineer',
    company        : 'FinPay Africa',
    companyUrl     : 'https://finpay.africa',
    location       : 'Nairobi, Kenya',
    employmentType : 'Full-time',
    startDate      : new Date('2023-01-15'),
    isCurrent      : true,
    duration       : 'Jan 2023 – Present',
    responsibilities: [
      'Architected and deployed a payment gateway API serving 500k+ users across 12 African markets.',
      'Reduced API response time by 65% through Redis caching, query optimization, and async processing.',
      'Led migration from monolith to microservices architecture, improving deployment frequency 3x.',
      'Implemented OAuth2 + JWT auth with refresh token rotation across 5 service boundaries.',
      'Established API versioning strategy and maintained backward compatibility across 3 major versions.',
    ],
    technologies: ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'AWS', 'Kafka'],
    achievements: [
      'Reduced payment processing latency from 850ms to 120ms average',
      'Achieved 99.97% uptime SLO over 18 consecutive months',
    ],
    visible: true,
    order  : 1,
  },
  {
    role           : 'Backend Developer',
    company        : 'BuildStack Technologies',
    companyUrl     : 'https://buildstack.io',
    location       : 'Nairobi, Kenya',
    employmentType : 'Full-time',
    startDate      : new Date('2021-06-01'),
    endDate        : new Date('2022-12-31'),
    isCurrent      : false,
    duration       : 'Jun 2021 – Dec 2022',
    responsibilities: [
      'Built RESTful APIs for a SaaS project management platform serving 20k+ active users.',
      'Designed relational database schema supporting complex multi-tenant data isolation.',
      'Integrated third-party services: Stripe, Twilio, SendGrid, and Google OAuth.',
      'Maintained comprehensive API documentation with Swagger and achieved 98% uptime SLO.',
      'Mentored 2 junior developers and conducted weekly code reviews.',
    ],
    technologies: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'Stripe API', 'SendGrid', 'Swagger'],
    achievements: [
      'Reduced API error rate from 4.2% to 0.3% through systematic testing',
      'Onboarded and integrated 5 new enterprise clients to the platform',
    ],
    visible: true,
    order  : 2,
  },
  {
    role           : 'Junior Software Engineer',
    company        : 'DataSync Labs',
    companyUrl     : 'https://datasynclabs.io',
    location       : 'Nairobi, Kenya (Hybrid)',
    employmentType : 'Full-time',
    startDate      : new Date('2020-08-01'),
    endDate        : new Date('2021-05-31'),
    isCurrent      : false,
    duration       : 'Aug 2020 – May 2021',
    responsibilities: [
      'Developed data ingestion pipelines processing 2M+ records daily from external APIs.',
      'Built admin dashboards and internal tooling using Django and vanilla JavaScript.',
      'Contributed to open-source ORM tooling used by 1,200+ developers on GitHub.',
      'Wrote unit and integration tests achieving 85%+ code coverage across core modules.',
    ],
    technologies: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'JavaScript', 'pytest'],
    achievements: [
      'Open-source ORM contributions reached 1,200+ GitHub stars',
    ],
    visible: true,
    order  : 3,
  },
];

// ── Seed function ──────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── Admin ──
    const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!existing) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        email   : process.env.ADMIN_EMAIL    || 'admin@alexoduya.dev',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role    : 'super_admin',
      });
      console.log('✅ Admin user created');
      console.log(`   username: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    } else {
      console.log('ℹ️  Admin user already exists — skipping');
    }

    // ── Projects ──
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
      await Project.insertMany(PROJECTS);
      console.log(`✅ Seeded ${PROJECTS.length} projects`);
    } else {
      console.log(`ℹ️  Projects already exist (${projCount}) — skipping`);
    }

    // ── Experiences ──
    const expCount = await Experience.countDocuments();
    if (expCount === 0) {
      await Experience.insertMany(EXPERIENCES);
      console.log(`✅ Seeded ${EXPERIENCES.length} experiences`);
    } else {
      console.log(`ℹ️  Experiences already exist (${expCount}) — skipping`);
    }

    console.log('\n🎉 Seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();