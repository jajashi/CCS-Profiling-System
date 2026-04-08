require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../models/User');

const SEED_USERS = [
  { username: 'admin', password: '__USE_SEED_ADMIN_PASSWORD_IN_ENV__', name: 'System Admin', role: 'admin' },
  { username: 'faculty001', password: '__USE_SEED_FACULTY_PASSWORD_IN_ENV__', name: 'Faculty User', role: 'faculty' },
  { username: '2201001', password: '__USE_SEED_STUDENT_PASSWORD_IN_ENV__', name: 'Jan Earl Eclarinal Olivar', role: 'student', studentId: '2201001' },
  { username: '2201002', password: '__USE_SEED_STUDENT_PASSWORD_IN_ENV__', name: 'Eden Santos Nataya', role: 'student', studentId: '2201002' }
];

async function seed() {
  try {
    await connectDB();
    
    console.log('Clearing existing users...');
    await User.deleteMany({});

    console.log('Seeding users...');
    for (const u of SEED_USERS) {
      await User.create(u);
      console.log(`Created user: ${u.username}`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
