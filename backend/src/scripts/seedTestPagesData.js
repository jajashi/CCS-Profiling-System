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

/** Only used in ActivityLog.metadata for idempotent cleanup — not shown in UI copy. */
const SEED_METADATA_TAG = 'ccs-profiling-demo';

const EVENT_TITLE_TECH_FORUM = 'CCS Technical Forum';
const EVENT_TITLE_CAREER = 'Career Development Workshop';

const CURRICULA = [
  {
    courseCode: 'CCS101',
    courseTitle: 'Introduction to Computing',
    curriculumYear: '2024',
    description:
      'Foundational concepts in computing, problem decomposition, and basic programming literacy for computing majors.',
    program: 'CS',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: [],
    courseLearningOutcomes: [
      'Explain core computing concepts',
      'Use basic problem-solving patterns in small programs',
    ],
    status: 'Active',
  },
  {
    courseCode: 'CCS201',
    courseTitle: 'Database Systems',
    curriculumYear: '2024',
    description:
      'Relational data modeling, normalization, SQL, and practical use of database management systems in applications.',
    program: 'IT',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: ['CCS101'],
    courseLearningOutcomes: ['Design normalized schemas', 'Implement and optimize SQL queries'],
    status: 'Active',
  },
  {
    courseCode: 'CCS301',
    courseTitle: 'Software Engineering',
    curriculumYear: '2024',
    description:
      'Software lifecycle, requirements, design, testing, teamwork, and delivery practices for medium-scale systems.',
    program: 'CS',
    creditUnits: 3,
    lectureHours: 3,
    labHours: 0,
    prerequisites: ['CCS101'],
    courseLearningOutcomes: ['Plan iterative delivery', 'Apply quality and testing practices'],
    status: 'Active',
  },
  {
    courseCode: 'CCS401',
    courseTitle: 'Network Administration',
    curriculumYear: '2024',
    description:
      'LAN/WAN fundamentals, addressing, routing, services, security basics, and troubleshooting in lab environments.',
    program: 'IT',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 2,
    prerequisites: ['CCS201'],
    courseLearningOutcomes: ['Configure common network services', 'Diagnose connectivity and performance issues'],
    status: 'Active',
  },
];

const ROOMS = [
  { roomCode: 'RM101', name: 'CCS Lecture Hall 101', type: 'Lecture', maximumCapacity: 45, building: 'Main', status: 'Active' },
  { roomCode: 'RM102', name: 'CCS Lecture Hall 102', type: 'Lecture', maximumCapacity: 40, building: 'Main', status: 'Active' },
  { roomCode: 'LAB201', name: 'CCS Computer Laboratory 201', type: 'IT Lab', maximumCapacity: 35, building: 'Annex', status: 'Active' },
  { roomCode: 'LAB202', name: 'CCS Computer Laboratory 202', type: 'IT Lab', maximumCapacity: 35, building: 'Annex', status: 'Active' },
];

const TIME_BLOCK_SPECS = [
  {
    label: 'Monday & Wednesday morning',
    durationMinutes: 120,
    daysOfWeek: ['Mon', 'Wed'],
    startTime: '08:00',
    endTime: '10:00',
  },
  {
    label: 'Tuesday & Thursday late morning',
    durationMinutes: 120,
    daysOfWeek: ['Tue', 'Thu'],
    startTime: '10:00',
    endTime: '12:00',
  },
  {
    label: 'Monday & Wednesday afternoon',
    durationMinutes: 120,
    daysOfWeek: ['Mon', 'Wed'],
    startTime: '13:00',
    endTime: '15:00',
  },
  {
    label: 'Tuesday & Thursday afternoon',
    durationMinutes: 120,
    daysOfWeek: ['Tue', 'Thu'],
    startTime: '15:00',
    endTime: '17:00',
  },
];

const TIME_BLOCK_LABELS = TIME_BLOCK_SPECS.map((b) => b.label);

const SECTION_BLUEPRINTS = [
  { key: 'CCS101', term: 'First Semester', academicYear: '2026-2027', status: 'Open' },
  { key: 'CCS201', term: 'First Semester', academicYear: '2026-2027', status: 'Open' },
  { key: 'CCS301', term: 'First Semester', academicYear: '2026-2027', status: 'Waitlisted' },
  { key: 'CCS401', term: 'First Semester', academicYear: '2026-2027', status: 'Closed' },
];

const EXTRA_COURSE_TITLES = [
  'Human-Computer Interaction',
  'Web Systems and Technologies',
  'Information Assurance and Security',
  'Data Structures and Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Object-Oriented Programming',
  'Discrete Structures for Computing',
  'Theory of Computation',
  'Mobile Application Development',
  'Cloud Computing Fundamentals',
  'Data Analytics with Python',
  'Systems Analysis and Design',
  'Internet of Things',
  'Digital Logic Design',
  'Computer Organization and Architecture',
  'Programming Languages',
  'Distributed Systems',
  'Machine Learning Fundamentals',
  'Ethics and Professional Practice in Computing',
];

function buildExtraCurricula(total = 40) {
  return Array.from({ length: total }, (_, index) => {
    const num = index + 1;
    const courseCode = `CCS${String(500 + index).padStart(3, '0')}`;
    const isEven = index % 2 === 0;
    const title = `${EXTRA_COURSE_TITLES[index % EXTRA_COURSE_TITLES.length]} (${isEven ? 'CS' : 'IT'} offering)`;
    return {
      courseCode,
      courseTitle: title,
      curriculumYear: String(2020 + (index % 6)),
      description: `Upper-level or service course in the CCS curriculum catalog. Credit-bearing; prerequisites vary by program adviser approval.`,
      program: isEven ? 'CS' : 'IT',
      creditUnits: 3,
      lectureHours: 2,
      labHours: index % 3 === 0 ? 1 : 2,
      prerequisites: num > 1 ? [`CCS${String(500 + index - 1).padStart(3, '0')}`] : [],
      courseLearningOutcomes: [
        'Demonstrate mastery of core topics in the course outline',
        'Complete laboratory or project work to program standards',
      ],
      status: index % 13 === 0 ? 'Archived' : 'Active',
    };
  });
}

const MIDDLE_POOL = [
  'Marie',
  'Anne',
  'Rose',
  'James',
  'Paul',
  'Grace',
  'Luis',
  '',
  'Carmen',
  'Rafael',
];

const EMERGENCY_NAMES = [
  'Maria Santos',
  'Jose Reyes',
  'Ana Cruz',
  'Roberto Lim',
  'Elena Torres',
  'Carlos Mendoza',
];

const CERT_POOL = [
  'Cisco CCNA (expired renewal in progress)',
  'Microsoft Azure Fundamentals',
  'Google Cloud Associate Engineer',
  'CompTIA Security+',
  '',
  'AWS Cloud Practitioner',
];

function buildExtraFaculty(year, total = 30) {
  const firstNames = [
    'Adrian',
    'Beatriz',
    'Carlo',
    'Diana',
    'Enzo',
    'Faith',
    'Gino',
    'Hannah',
    'Ivan',
    'Jessa',
    'Kevin',
    'Lara',
    'Miguel',
    'Nina',
    'Oscar',
  ];
  const lastNames = [
    'Alonzo',
    'Bautista',
    'Castro',
    'Domingo',
    'Estrada',
    'Flores',
    'Garcia',
    'Herrera',
    'Ignacio',
    'Jimenez',
    'Lopez',
    'Morales',
    'Navarro',
    'Ocampo',
    'Pascual',
  ];
  return Array.from({ length: total }, (_, index) => {
    const n = index + 1;
    const employeeId = `FAC-${year}-${String(100 + n).padStart(3, '0')}`;
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const department = index % 2 === 0 ? 'CS' : 'IT';
    const suffix = employeeId.split('-').pop();
    const institutionalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@ccs.edu`;
    return {
      employeeId,
      firstName,
      middleName: MIDDLE_POOL[index % MIDDLE_POOL.length],
      lastName,
      dob: `${1980 + (index % 15)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
      department,
      profileAvatar: '',
      institutionalEmail,
      personalEmail: '',
      mobileNumber: `0917${String(1000000 + n).slice(-7)}`,
      emergencyContactName: EMERGENCY_NAMES[index % EMERGENCY_NAMES.length],
      emergencyContactNumber: `0918${String(1000000 + n).slice(-7)}`,
      position: index % 3 === 0 ? 'Associate Professor' : 'Assistant Professor',
      employmentType: index % 4 === 0 ? 'Part-time' : 'Full-time',
      contractType: index % 4 === 0 ? 'Semester-based' : '',
      dateHired: `${2010 + (index % 12)}-06-15`,
      status: index % 9 === 0 ? 'Inactive' : 'Active',
      inactiveReason: index % 9 === 0 ? 'On approved leave / inactive assignment' : '',
      highestEducation: index % 2 === 0 ? 'MS Computer Science' : 'MS Information Technology',
      fieldOfStudy: department === 'CS' ? 'Computer Science' : 'Information Technology',
      certifications: CERT_POOL[index % CERT_POOL.length],
      specializations: [],
      internalNotes: '',
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
    topic: `Week ${weekNumber}: Topics per course outline (lecture and laboratory as scheduled)`,
    objectives: [
      `Meet learning outcome ${weekNumber}.1 from the official syllabus`,
      `Complete guided exercises for week ${weekNumber}`,
    ],
    materials: ['Lecture slides', 'Laboratory manual', 'Learning management system readings'],
    assessments: weekNumber <= 2 ? `Formative assessment ${weekNumber}` : `Summative checkpoint ${weekNumber}`,
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
  console.log('Seeding curriculum, scheduling, syllabi, events, and activity data…');

  const year = new Date().getUTCFullYear();

  await Curriculum.deleteMany({ courseCode: { $regex: /^QA\d{4}$/ } }).catch(() => {});

  const extraCurricula = buildExtraCurricula(40);
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
    TIME_BLOCK_SPECS.map((block, index) => ({
      filter: { label: block.label },
      doc: {
        ...block,
        status: 'Active',
        curriculumId: curricula[index % curricula.length]._id,
      },
    })),
  );
  const timeBlocks = await TimeBlock.find({ label: { $in: TIME_BLOCK_LABELS } }).lean();
  console.log(`Time blocks ready: ${timeBlocks.length}`);
  console.log(`Faculty ready: ${activeFaculty.length} active / ${await Faculty.countDocuments({})} total`);

  const seededSections = [];
  for (let index = 0; index < SECTION_BLUEPRINTS.length; index += 1) {
    const item = SECTION_BLUEPRINTS[index];
    const curriculum = curriculumByCode.get(item.key);
    if (!curriculum) continue;

    const faculty = activeFaculty[index % activeFaculty.length];
    const room = rooms[index % rooms.length];
    const scheduleTime =
      index % 2 === 0
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

  const syllabusDescriptionPrefix = /^Official syllabus for section /;
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
          description: `Official syllabus for section ${section.sectionIdentifier}. Aligned with the College of Computing Studies curriculum guide; includes outcomes, grading, policies, and weekly pacing.`,
          gradingSystem: '40% examinations, 40% projects and laboratory work, 20% participation and formative tasks',
          coursePolicies:
            'Attendance follows university rules; late submissions incur penalties unless excused; academic integrity policy applies to all work.',
          status: syllabusStatus,
          weeklyLessons: buildWeeklyLessons(facultyId),
        },
      },
      { upsert: true },
    );
  }
  const syllabiCount = await Syllabus.countDocuments({ description: { $regex: syllabusDescriptionPrefix } });
  console.log(`Syllabi ready: ${syllabiCount}`);

  const adminUser = users.find((u) => u.role === 'admin') || users[0];
  const facultyUser = users.find((u) => u.role === 'faculty') || users[0];
  const studentUsers = users.filter((u) => u.role === 'student').slice(0, 8);
  const now = new Date();

  const eventDocs = [
    {
      title: EVENT_TITLE_TECH_FORUM,
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
      title: EVENT_TITLE_CAREER,
      type: 'Extra-Curricular',
      status: 'published',
      schedule: {
        date: addDays(now, 10),
        startTime: addDays(now, 10),
        endTime: addDays(now, 10),
      },
      timezone: 'Asia/Manila',
      isVirtual: true,
      meetingUrl: 'https://meet.google.com/lookup/ccs-career-workshop',
      targetGroups: { roles: ['student'], programs: ['BSIT'], yearLevels: ['2', '3'] },
      organizers: [{ userId: adminUser._id, role: 'Moderator' }],
      attendees: [],
      waitlist: [],
      rsvpClosed: false,
      feedbackEnabled: true,
      certificatesGenerated: false,
    },
  ];

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
  const eventsCount = await Event.countDocuments({
    title: { $in: [EVENT_TITLE_TECH_FORUM, EVENT_TITLE_CAREER] },
  });
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
      metadata: { seedTag: SEED_METADATA_TAG },
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
      metadata: { seedTag: SEED_METADATA_TAG },
    },
    {
      actorUserId: adminUser._id,
      actorRole: 'admin',
      actorName: adminUser.name || 'System Admin',
      actorIdentifier: adminUser.username || 'admin',
      action: 'Published event',
      module: 'Events',
      target: EVENT_TITLE_TECH_FORUM,
      status: 'Published',
      metadata: { seedTag: SEED_METADATA_TAG },
    },
  ];

  await ActivityLog.deleteMany({ 'metadata.seedTag': SEED_METADATA_TAG });
  await ActivityLog.insertMany(activityDocs);
  console.log(`Activity logs ready: ${activityDocs.length}`);

  console.log('\nDone. Seeded data for:');
  console.log('- Curriculum / curricula management');
  console.log('- Scheduling (sections, rooms, time blocks)');
  console.log('- Syllabus');
  console.log('- Events');
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
