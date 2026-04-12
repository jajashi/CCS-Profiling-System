require('dotenv').config();

const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');

const year = new Date().getUTCFullYear();
const ID_PREFIX = `FAC-${year}-`;

const MOCK_FACULTY = [
  {
    firstName: 'Luvim',
    middleName: 'M.',
    lastName: 'Eusebio',
    dob: '1990-04-12',
    department: 'CS',
    profileAvatar: '',
    institutionalEmailKey: 'luvim.eusebio.seed@ccs.edu',
    personalEmail: '',
    mobileNumber: '09175550999',
    emergencyContactName: '',
    emergencyContactNumber: '',
    position: 'Associate Professor',
    employmentType: 'Full-time',
    contractType: '',
    dateHired: '2018-06-15',
    status: 'Active',
    inactiveReason: '',
    highestEducation: 'PhD',
    fieldOfStudy: 'Computer Science',
    certifications: '',
    specializations: [],
    internalNotes: '',
  },
  {
    firstName: 'Arcelito',
    middleName: '',
    lastName: 'Quiatchon',
    dob: '1987-02-20',
    department: 'IT',
    profileAvatar: '',
    institutionalEmailKey: 'arcelito.quiatchon.seed@ccs.edu',
    personalEmail: '',
    mobileNumber: '09175550888',
    emergencyContactName: '',
    emergencyContactNumber: '',
    position: 'Assistant Professor',
    employmentType: 'Full-time',
    contractType: '',
    dateHired: '2019-01-10',
    status: 'Active',
    inactiveReason: '',
    highestEducation: '',
    fieldOfStudy: 'Information Technology',
    certifications: '',
    specializations: [],
    internalNotes: '',
  },
];

const SEED_FACULTY_COUNT = 2;

const SEEDED_FACULTY = MOCK_FACULTY.slice(0, SEED_FACULTY_COUNT).map((row, index) => {
  const suffix = String(index + 1).padStart(3, '0');
  const employeeId = `${ID_PREFIX}${suffix}`;
  const { institutionalEmailKey, ...rest } = row;
  return {
    ...rest,
    employeeId,
    institutionalEmail: `${institutionalEmailKey}.seed.${year}@ccs.edu`.toLowerCase(),
  };
});

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Database connected');

  const idPattern = new RegExp(`^FAC-${year}-`);
  const clearResult = await Faculty.deleteMany({ employeeId: idPattern });
  console.log(`Cleared ${clearResult.deletedCount} existing faculty with ids matching ${idPattern}.`);

  await Faculty.bulkWrite(
    SEEDED_FACULTY.map((doc) => ({
      updateOne: {
        filter: { employeeId: doc.employeeId },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );
  console.log(`Seeded ${SEEDED_FACULTY.length} faculty (${ID_PREFIX}001 …).`);
  console.log(`Faculty login (seed:users) uses: ${SEEDED_FACULTY[0].employeeId} / (from SEED_FACULTY_PASSWORD in backend/.env)`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
