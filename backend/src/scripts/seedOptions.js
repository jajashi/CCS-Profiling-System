require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const ReferenceOption = require('../models/ReferenceOption');

const defaultOptions = [
  // Skills
  { category: 'Skill', value: 'Programming', label: 'Programming' },
  { category: 'Skill', value: 'Web Development', label: 'Web Development' },
  { category: 'Skill', value: 'Database Management', label: 'Database Management' },
  { category: 'Skill', value: 'UI/UX Design', label: 'UI/UX Design' },
  { category: 'Skill', value: 'Data Analysis', label: 'Data Analysis' },
  { category: 'Skill', value: 'Communication', label: 'Communication' },
  { category: 'Skill', value: 'Leadership', label: 'Leadership' },
  { category: 'Skill', value: 'Problem Solving', label: 'Problem Solving' },
  // Violations
  { category: 'Violation', value: 'None', label: 'None' },
  { category: 'Violation', value: 'Warning (late)', label: 'Warning (late)' },
  { category: 'Violation', value: 'Academic probation', label: 'Academic probation' },
  { category: 'Violation', value: 'Dress Code Violation', label: 'Dress Code Violation' },
  { category: 'Violation', value: 'Cheating', label: 'Cheating' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const opt of defaultOptions) {
      await ReferenceOption.findOneAndUpdate(
        { category: opt.category, value: opt.value },
        opt,
        { upsert: true, new: true }
      );
    }

    console.log('Options seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
