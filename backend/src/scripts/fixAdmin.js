/**
 * Quick script to create admin user
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ccs_profiling');
    console.log('Connected to MongoDB');
    
    // Delete existing admin if any
    await User.deleteOne({ username: 'admin' });
    console.log('Cleared existing admin');
    
    // Create new admin with hashed password
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
      email: 'admin@university.edu.ph',
      isActive: true
    });
    
    console.log('Admin user created:', admin.username);
    console.log('Password:', password);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

main();
