/**
 * Seeds 1 admin, 1 faculty, 2 students.
 * Set passwords via .env file
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const User = require('../models/User');

const year = new Date().getUTCFullYear();
const FACULTY_LOGIN_ID = `FAC-${year}-001`;

function requireEnv(name) {
  const v = process.env[name];
  if (v == null || String(v).trim() === '') {
    throw new Error(
      `Missing ${name}. Set it in backend/.env before running this script. See backend/.env.example.`
    );
  }
  return String(v);
}

function buildSeedUsers() {
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  return [
    { username: 'admin', password: adminPassword, name: 'System Admin', role: 'admin' }
    // no faculty or student accounts
  ];
}

async function seed() {
  try {
    const SEED_USERS = buildSeedUsers();
    await connectDB();

    console.log('Clearing existing users...');
    await User.deleteMany({});

    console.log('Seeding users...');
    for (const u of SEED_USERS) {
      await User.create(u);
      console.log(`Created user: ${u.username} (${u.role})`);
    }

    console.log('\nSeeding complete.');
    console.log(`Faculty login username must match seeded faculty: ${FACULTY_LOGIN_ID}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();