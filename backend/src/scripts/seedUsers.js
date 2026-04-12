/**
 * - 1 admin, 1 faculty, 2 students 
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../models/User');

const year = new Date().getUTCFullYear();
const FACULTY_LOGIN_ID = `FAC-${year}-001`;

const SEED_USERS = [
  { username: 'admin', password: 'admin123', name: 'System Admin', role: 'admin' },
  {
    username: FACULTY_LOGIN_ID,
    password: 'faculty123',
    name: 'Luvim M. Eusebio',
    role: 'faculty',
  },
  {
    username: '2201001',
    password: 'student123',
    name: 'Jan Earl Eclarinal Olivar',
    role: 'student',
    studentId: '2201001',
  },
  {
    username: '2201002',
    password: 'student123',
    name: 'Eden Santos Nataya',
    role: 'student',
    studentId: '2201002',
  },
];

async function seed() {
  try {
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
