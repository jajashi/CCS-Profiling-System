/**
 * Creates sample Section rows linked to an Active curriculum and Active faculty
 * when none exist. Run: node src/scripts/seedSections.js
 */
require('dotenv').config();

const mongoose = require('mongoose');
const Curriculum = require('../models/Curriculum');
const Faculty = require('../models/Faculty');

async function resolveSectionModel() {
  if (mongoose.models.Section) return mongoose.models.Section;
  return require('../models/Section');
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const Section = await resolveSectionModel();

  const count = await Section.countDocuments();
  if (count > 0) {
    console.log(`Sections already exist (${count}). Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const curriculum = await Curriculum.findOne({ status: 'Active' }).sort({ courseCode: 1 }).lean();
  const faculty = await Faculty.findOne({ status: 'Active' }).sort({ employeeId: 1 }).lean();

  if (!curriculum || !faculty) {
    console.error('Need at least one Active curriculum and one Active faculty to seed sections.');
    await mongoose.disconnect();
    process.exit(1);
  }

  await Section.create({
    sectionIdentifier: `${curriculum.courseCode}-1A-FA25`,
    term: 'First Semester',
    academicYear: '2025-2026',
    curriculumId: curriculum._id,
    facultyId: faculty._id,
    status: 'Active',
  });

  console.log('Seeded one Active section for scheduling and syllabi.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
