require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Curriculum = require('../models/Curriculum');
const Section = require('../models/Section');
const Room = require('../models/Room');
const TimeBlock = require('../models/TimeBlock');
const { Syllabus } = require('../models/Syllabus');
const Event = require('../models/Event');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const TEST_TAG = 'qa-seed-2026';

const CURRICULA = [
  {
    courseCode: 'CCS101',
    courseTitle: 'Introduction to Computing',
    curriculumYear: '2024',
    description: `${TEST_TAG} foundational computing concepts.`,
    program: 'CS',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: [],
    courseLearningOutcomes: ['Explain core computing concepts', 'Use basic problem-solving patterns'],
    status: 'Active',
  },
  {
    courseCode: 'CCS201',
    courseTitle: 'Database Systems',
    curriculumYear: '2024',
    description: `${TEST_TAG} relational design and SQL.`,
    program: 'IT',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: ['CCS101'],
    courseLearningOutcomes: ['Design normalized schemas', 'Build SQL queries'],
    status: 'Active',
  },
  {
    courseCode: 'CCS301',
    courseTitle: 'Software Engineering',
    curriculumYear: '2024',
    description: `${TEST_TAG} lifecycle and team delivery.`,
    program: 'CS',
    creditUnits: 3,
    lectureHours: 3,
    labHours: 0,
    prerequisites: ['CCS101'],
    courseLearningOutcomes: ['Plan iterative delivery', 'Apply quality practices'],
    status: 'Active',
  },
  {
    courseCode: 'CCS401',
    courseTitle: 'Network Administration',
    curriculumYear: '2024',
    description: `${TEST_TAG} network setup and operations.`,
    program: 'IT',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: ['CCS201'],
    courseLearningOutcomes: ['Configure network services', 'Troubleshoot connectivity'],
    status: 'Active',
  },
];

const ROOMS = [
  { roomCode: 'RM101', name: 'CCS Lecture 101', type: 'Lecture', maximumCapacity: 45, building: 'Main', status: 'Active' },
  { roomCode: 'RM102', name: 'CCS Lecture 102', type: 'Lecture', maximumCapacity: 40, building: 'Main', status: 'Active' },
  { roomCode: 'LAB201', name: 'CCS IT Lab 201', type: 'IT Lab', maximumCapacity: 35, building: 'Annex', status: 'Active' },
  { roomCode: 'LAB202', name: 'CCS IT Lab 202', type: 'IT Lab', maximumCapacity: 35, building: 'Annex', status: 'Active' },
];

const TIME_BLOCKS = [
  { label: `${TEST_TAG} Morning Block`, durationMinutes: 120, daysOfWeek: ['Mon', 'Wed'], startTime: '08:00', endTime: '10:00' },
  { label: `${TEST_TAG} Midday Block`, durationMinutes: 120, daysOfWeek: ['Tue', 'Thu'], startTime: '10:00', endTime: '12:00' },
  { label: `${TEST_TAG} Afternoon Block`, durationMinutes: 120, daysOfWeek: ['Mon', 'Wed'], startTime: '13:00', endTime: '15:00' },
  { label: `${TEST_TAG} Late Block`, durationMinutes: 120, daysOfWeek: ['Tue', 'Thu'], startTime: '15:00', endTime: '17:00' },
];

const SECTION_BLUEPRINTS = [
  { key: 'CCS101', term: 'First Semester', academicYear: '2026-2027', status: 'Open' },
  { key: 'CCS201', term: 'First Semester', academicYear: '2026-2027', status: 'Open' },
  { key: 'CCS301', term: 'First Semester', academicYear: '2026-2027', status: 'Waitlisted' },
  { key: 'CCS401', term: 'First Semester', academicYear: '2026-2027', status: 'Closed' },
];

function buildExtraCurricula(total = 120) {
  return Array.from({ length: total }, (_, index) => {
    const num = String(index + 1).padStart(4, '0');
    const isEven = index % 2 === 0;
    return {
      courseCode: `QA${num}`,
      courseTitle: `${isEven ? 'CS' : 'IT'} QA Seed Course ${index + 1}`,
      curriculumYear: String(2020 + (index % 7)),
      description: `${TEST_TAG} pagination curriculum ${index + 1}`,
      program: isEven ? 'CS' : 'IT',
      creditUnits: 3,
      lectureHours: 2,
      labHours: 2,
      prerequisites: index > 0 ? [`QA${String(index).padStart(4, '0')}`] : [],
      courseLearningOutcomes: ['Understand core concepts', 'Apply practical techniques'],
      status: index % 11 === 0 ? 'Archived' : 'Active',
    };
  });
}

function buildExtraFaculty(year, total = 30) {
  const firstNames = ['Adrian', 'Bea', 'Carlo', 'Diana', 'Enzo', 'Faith', 'Gino', 'Hanna', 'Ivan', 'Jessa'];
  const lastNames = ['Alonzo', 'Bautista', 'Castro', 'Domingo', 'Estrada', 'Flores', 'Garcia', 'Herrera', 'Ignacio', 'Jimenez'];
  return Array.from({ length: total }, (_, index) => {
    const n = index + 1;
    const employeeId = `FAC-${year}-${String(100 + n).padStart(3, '0')}`;
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const department = index % 2 === 0 ? 'CS' : 'IT';
    return {
      employeeId,
      firstName,
      middleName: String.fromCharCode(65 + (index % 26)) + '.',
      lastName,
      dob: `${1980 + (index % 15)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
      department,
      profileAvatar: '',
      institutionalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${n}.${TEST_TAG.replace(/[^a-z0-9]/gi, '').toLowerCase()}@ccs.edu`,
      personalEmail: '',
      mobileNumber: `0917${String(1000000 + n).slice(-7)}`,
      emergencyContactName: `Emergency Contact ${n}`,
      emergencyContactNumber: `0918${String(1000000 + n).slice(-7)}`,
      position: index % 3 === 0 ? 'Associate Professor' : 'Assistant Professor',
      employmentType: index % 4 === 0 ? 'Part-time' : 'Full-time',
      contractType: index % 4 === 0 ? 'Semester-based' : '',
      dateHired: `${2010 + (index % 12)}-06-15`,
      status: index % 9 === 0 ? 'Inactive' : 'Active',
      inactiveReason: index % 9 === 0 ? `${TEST_TAG} leave` : '',
      highestEducation: index % 2 === 0 ? 'MS Computer Science' : 'MS Information Technology',
      fieldOfStudy: department === 'CS' ? 'Computer Science' : 'Information Technology',
      certifications: 'QA seed certification',
      specializations: [],
      internalNotes: TEST_TAG,
    };
  });
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function buildWeeklyLessons(facultyId) {
  return [1, 2, 3, 4].map((weekNumber) => ({
    weekNumber,
    topic: `Week ${weekNumber} Lesson Plan (${TEST_TAG})`,
    objectives: [`Objective ${weekNumber}A`, `Objective ${weekNumber}B`],
    materials: ['Slides', 'Lab handout'],
    assessments: `Quiz ${weekNumber}`,
    timeAllocation: { lectureMinutes: 60, labMinutes: 60 },
    status: weekNumber === 1 ? 'Delivered' : 'Pending',
    deliveredAt: weekNumber === 1 ? new Date() : null,
    deliveredBy: weekNumber === 1 ? facultyId : null,
  }));
}

async function upsertManyByFilter(Model, docsWithFilter) {
  if (!docsWithFilter.length) return;
  await Model.bulkWrite(
    docsWithFilter.map(({ filter, doc }) => ({
      updateOne: {
        filter,
        update: { $set: doc },
        upsert: true,
      },
    })),
  );
}

async function run() {
  await connectDB();
  console.log('Seeding test-page data...');

  const year = new Date().getUTCFullYear();
  const extraCurricula = buildExtraCurricula(120);
  const extraFaculty = buildExtraFaculty(year, 30);

  await upsertManyByFilter(
    Curriculum,
    [...CURRICULA, ...extraCurricula].map((doc) => ({ filter: { courseCode: doc.courseCode }, doc })),
  );
  await upsertManyByFilter(
    Faculty,
    extraFaculty.map((doc) => ({ filter: { employeeId: doc.employeeId }, doc })),
  );

  const [activeFaculty, students, users] = await Promise.all([
    Faculty.find({ status: 'Active' }).sort({ employeeId: 1 }).lean(),
    Student.find({}).sort({ id: 1 }).limit(120).lean(),
    User.find({}).sort({ createdAt: 1 }).lean(),
  ]);

  if (!activeFaculty.length) {
    throw new Error('No active faculty found. Run `npm run seed:faculty` first.');
  }
  if (!students.length) {
    throw new Error('No students found. Run `npm run seed` first.');
  }
  if (!users.length) {
    throw new Error('No users found. Run `npm run seed:users` first.');
  }

  const curricula = await Curriculum.find({ courseCode: { $in: CURRICULA.map((c) => c.courseCode) } }).lean();
  const curriculumByCode = new Map(curricula.map((c) => [c.courseCode, c]));
  const totalCurriculaCount = await Curriculum.countDocuments({});
  console.log(`Curricula ready: ${curricula.length} core / ${totalCurriculaCount} total`);

  await upsertManyByFilter(
    Room,
    ROOMS.map((doc) => ({ filter: { roomCode: doc.roomCode }, doc })),
  );
  const rooms = await Room.find({ roomCode: { $in: ROOMS.map((r) => r.roomCode) } }).sort({ roomCode: 1 }).lean();
  console.log(`Rooms ready: ${rooms.length}`);

  await upsertManyByFilter(
    TimeBlock,
    TIME_BLOCKS.map((block, index) => ({
      filter: { label: block.label },
      doc: {
        ...block,
        status: 'Active',
        curriculumId: curricula[index % curricula.length]._id,
      },
    })),
  );
  const timeBlocks = await TimeBlock.find({ label: { $regex: TEST_TAG } }).lean();
  console.log(`Time blocks ready: ${timeBlocks.length}`);
  console.log(`Faculty ready: ${activeFaculty.length} active / ${await Faculty.countDocuments({})} total`);

  const seededSections = [];
  for (let index = 0; index < SECTION_BLUEPRINTS.length; index += 1) {
    const item = SECTION_BLUEPRINTS[index];
    const curriculum = curriculumByCode.get(item.key);
    if (!curriculum) continue;

    const faculty = activeFaculty[index % activeFaculty.length];
    const room = rooms[index % rooms.length];
    const scheduleTime = index % 2 === 0
      ? { dayOfWeek: 'Mon', startTime: '08:00', endTime: '10:00' }
      : { dayOfWeek: 'Tue', startTime: '10:00', endTime: '12:00' };

    const identifier = `${curriculum.courseCode}-${item.term.startsWith('First') ? 'FS' : 'SS'}-${item.academicYear.slice(-2)}-S${index + 1}`;
    const enrolled = students.slice(index * 15, index * 15 + 15).map((s) => s._id);

    await Section.updateOne(
      { sectionIdentifier: identifier },
      {
        $set: {
          sectionIdentifier: identifier,
          curriculumId: curriculum._id,
          term: item.term,
          academicYear: item.academicYear,
          status: item.status,
          currentEnrollmentCount: enrolled.length,
          enrolledStudentIds: enrolled,
          schedules: [
            {
              roomId: room._id,
              facultyId: faculty._id,
              dayOfWeek: scheduleTime.dayOfWeek,
              startTime: scheduleTime.startTime,
              endTime: scheduleTime.endTime,
            },
          ],
        },
      },
      { upsert: true },
    );

    const saved = await Section.findOne({ sectionIdentifier: identifier }).lean();
    seededSections.push(saved);
  }
  console.log(`Sections ready: ${seededSections.length}`);

  for (let index = 0; index < seededSections.length; index += 1) {
    const section = seededSections[index];
    const facultyId = section.schedules?.[0]?.facultyId || activeFaculty[index % activeFaculty.length]._id;
    const syllabusStatus = index % 3 === 0 ? 'Active' : 'Draft';

    await Syllabus.updateOne(
      { sectionId: section._id, curriculumId: section.curriculumId, facultyId },
      {
        $set: {
          sectionId: section._id,
          curriculumId: section.curriculumId,
          facultyId,
          description: `${TEST_TAG} syllabus for ${section.sectionIdentifier}`,
          gradingSystem: '40% Exams, 40% Projects, 20% Participation',
          coursePolicies: 'Attendance and submission policy for seeded QA data.',
          status: syllabusStatus,
          weeklyLessons: buildWeeklyLessons(facultyId),
        },
      },
      { upsert: true },
    );
  }
  const syllabiCount = await Syllabus.countDocuments({ description: { $regex: TEST_TAG } });
  console.log(`Syllabi ready: ${syllabiCount}`);

  const adminUser = users.find((u) => u.role === 'admin') || users[0];
  const facultyUser = users.find((u) => u.role === 'faculty') || users[0];
  const studentUsers = users.filter((u) => u.role === 'student').slice(0, 8);
  const now = new Date();

  const eventDocs = [
    {
      title: `${TEST_TAG} Tech Forum`,
      type: 'Curricular',
      status: 'published',
      schedule: {
        date: addDays(now, 7),
        startTime: addDays(now, 7),
        endTime: addDays(now, 7),
      },
      timezone: 'Asia/Manila',
      isVirtual: false,
      roomId: rooms[0]?._id,
      targetGroups: { roles: ['student'], programs: ['BSCS', 'BSIT'], yearLevels: ['1', '2', '3', '4'] },
      organizers: [{ userId: facultyUser._id, role: 'Host' }],
      attendees: studentUsers.map((u) => ({ userId: u._id, rsvpStatus: 'registered', attended: false })),
      waitlist: [],
      rsvpClosed: false,
      feedbackEnabled: false,
      certificatesGenerated: false,
    },
    {
      title: `${TEST_TAG} Career Coaching`,
      type: 'Extra-Curricular',
      status: 'published',
      schedule: {
        date: addDays(now, 10),
        startTime: addDays(now, 10),
        endTime: addDays(now, 10),
      },
      timezone: 'Asia/Manila',
      isVirtual: true,
      meetingUrl: 'https://meet.example.com/qa-seed-session',
      targetGroups: { roles: ['student'], programs: ['BSIT'], yearLevels: ['2', '3'] },
      organizers: [{ userId: adminUser._id, role: 'Moderator' }],
      attendees: [],
      waitlist: [],
      rsvpClosed: false,
      feedbackEnabled: true,
      certificatesGenerated: false,
    },
  ];

  // Set specific clock times so event validation and overlap checks behave predictably.
  eventDocs[0].schedule.startTime.setHours(9, 0, 0, 0);
  eventDocs[0].schedule.endTime.setHours(11, 0, 0, 0);
  eventDocs[1].schedule.startTime.setHours(14, 0, 0, 0);
  eventDocs[1].schedule.endTime.setHours(16, 0, 0, 0);

  await upsertManyByFilter(
    Event,
    eventDocs.map((doc) => ({
      filter: { title: doc.title },
      doc,
    })),
  );
  const eventsCount = await Event.countDocuments({ title: { $regex: TEST_TAG } });
  console.log(`Events ready: ${eventsCount}`);

  const activityDocs = [
    {
      actorUserId: adminUser._id,
      actorRole: 'admin',
      actorName: adminUser.name || 'System Admin',
      actorIdentifier: adminUser.username || 'admin',
      action: 'Updated curriculum',
      module: 'Instruction',
      target: 'CCS101',
      status: 'Completed',
      metadata: { seedTag: TEST_TAG },
    },
    {
      actorUserId: facultyUser._id,
      actorRole: 'faculty',
      actorName: facultyUser.name || 'Faculty Member',
      actorIdentifier: facultyUser.employeeId || facultyUser.username || '',
      action: 'Updated section resources',
      module: 'Scheduling',
      target: 'CCS101-FS-27-S1',
      status: 'Completed',
      metadata: { seedTag: TEST_TAG },
    },
    {
      actorUserId: adminUser._id,
      actorRole: 'admin',
      actorName: adminUser.name || 'System Admin',
      actorIdentifier: adminUser.username || 'admin',
      action: 'Published event',
      module: 'Events',
      target: `${TEST_TAG} Tech Forum`,
      status: 'Published',
      metadata: { seedTag: TEST_TAG },
    },
  ];

  await ActivityLog.deleteMany({ 'metadata.seedTag': TEST_TAG });
  await ActivityLog.insertMany(activityDocs);
  console.log(`Activity logs ready: ${activityDocs.length}`);

  console.log('\nDone. Seeded test data for pages/modules:');
  console.log('- Curriculum / Curricula Management');
  console.log('- Scheduling (sections, rooms, time blocks)');
  console.log('- Syllabus pages');
  console.log('- Events pages');
  console.log('- Dashboard recent activities');

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('seedTestPagesData failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
