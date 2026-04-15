require('dotenv').config();

const mongoose = require('mongoose');
const Specialization = require('../models/Specialization');

const DEFAULT_NAME = 'Software Development';
const DEFAULT_DESCRIPTION =
  'Design, implementation, testing, and maintenance of software systems and related practices.';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Database connected');

  const nameRegex = new RegExp(`^${DEFAULT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const existing = await Specialization.findOne({ name: nameRegex });
  if (existing) {
    if (!String(existing.description || '').trim()) {
      await Specialization.updateOne(
        { _id: existing._id },
        { $set: { description: DEFAULT_DESCRIPTION } },
      );
      console.log(`Updated description on "${existing.name}" (${existing._id})`);
    } else {
      console.log(`Specialization already present: "${existing.name}" (${existing._id})`);
    }
  } else {
    const created = await Specialization.create({
      name: DEFAULT_NAME,
      description: DEFAULT_DESCRIPTION,
    });
    console.log(`Created default specialization: "${created.name}" (${created._id})`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
