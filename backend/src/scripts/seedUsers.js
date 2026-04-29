/**
 * Seeds a single admin user. Set password via .env.
 * Faculty and student login accounts are created through the app (e.g. admin provisioning).
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const User = require('../models/User');

function requireEnv(name) {
  const v = process.env[name];
  if (v == null || String(v).trim() === '') {
    throw new Error(
      `Missing ${name}. Set it in backend/.env before running this script. See backend/.env.example.`,
    );
  }
  return String(v);
}

function buildSeedUsers() {
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  return [{ username: 'admin', password: adminPassword, name: 'System Admin', role: 'admin' }];
}

async function seed() {
  try {
    const SEED_USERS = buildSeedUsers();
    await connectDB();

    console.log('Seeding admin user...');
    // Removed User.deleteMany({}) to preserve faculty accounts

    console.log('Seeding users...');
    for (const u of SEED_USERS) {
      await User.create(u);
      console.log(`Created user: ${u.username} (${u.role})`);
    }

    console.log('\nSeeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
