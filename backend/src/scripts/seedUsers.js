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
  const facultyPassword = requireEnv('SEED_FACULTY_PASSWORD');
  const studentPassword = requireEnv('SEED_STUDENT_PASSWORD');

  return [
    { username: 'admin', password: adminPassword, name: 'System Admin', role: 'admin' },
    {
      username: FACULTY_LOGIN_ID,
      password: facultyPassword,
      name: 'Luvim M. Eusebio',
      role: 'faculty',
    },
    {
      username: '2201001',
      password: studentPassword,
      name: 'Jan Earl Eclarinal Olivar',
      role: 'student',
      studentId: '2201001',
    },
    {
      username: '2201002',
      password: studentPassword,
      name: 'Eden Santos Nataya',
      role: 'student',
      studentId: '2201002',
    },
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