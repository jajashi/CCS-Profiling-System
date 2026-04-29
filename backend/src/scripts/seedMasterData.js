/**
 * Master Data Seeder - Complete Database Seeding
 * Seeds: Specializations, Faculty, Students, Curricula, Rooms, TimeBlocks, Sections, Schedules, Syllabi, Events, Admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Import models
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Specialization = require('../models/Specialization');
const Curriculum = require('../models/Curriculum');
const Section = require('../models/Section');
const Room = require('../models/Room');
const TimeBlock = require('../models/TimeBlock');
const { Syllabus } = require('../models/Syllabus');
const Event = require('../models/Event');

// Config
const STUDENT_COUNT = 1000;
const FACULTY_COUNT = 50;
const SECTIONS_PER_YEAR = 4;
const ROOMS_COUNT = 15;
const EVENTS_COUNT = 20;

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function clearCollections() {
  console.log('Clearing collections...');
  await Promise.all([
    Student.deleteMany({}),
    Faculty.deleteMany({}),
    User.deleteMany({}),
    Specialization.deleteMany({}),
    Curriculum.deleteMany({}),
    Section.deleteMany({}),
    Room.deleteMany({}),
    TimeBlock.deleteMany({}),
    Syllabus.deleteMany({}),
    Event.deleteMany({})
  ]);
  console.log('Cleared all collections');
}

async function seedSpecializations() {
  console.log('Seeding specializations...');
  const specs = [
    { name: 'Web Development', description: 'Front-end and back-end web technologies', relatedSkills: ['HTML', 'CSS', 'JS', 'React', 'Node.js'], careerPaths: ['Frontend Dev', 'Backend Dev', 'Full Stack'] },
    { name: 'Mobile Development', description: 'iOS and Android mobile app development', relatedSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin'], careerPaths: ['Mobile Dev', 'iOS Dev', 'Android Dev'] },
    { name: 'Data Science', description: 'Data analysis, ML, and AI', relatedSkills: ['Python', 'R', 'SQL', 'ML'], careerPaths: ['Data Scientist', 'Data Analyst'] },
    { name: 'Cybersecurity', description: 'Network security and ethical hacking', relatedSkills: ['Network Security', 'Pen Testing'], careerPaths: ['Security Analyst', 'Ethical Hacker'] },
    { name: 'Cloud Computing', description: 'Cloud infrastructure and DevOps', relatedSkills: ['AWS', 'Azure', 'Docker', 'K8s'], careerPaths: ['Cloud Engineer', 'DevOps'] },
    { name: 'Database Management', description: 'Database design and administration', relatedSkills: ['SQL', 'PostgreSQL', 'MongoDB'], careerPaths: ['DB Admin', 'Data Engineer'] }
  ];
  return await Specialization.insertMany(specs);
}

async function seedFaculty(specializations) {
  console.log(`Seeding ${FACULTY_COUNT} faculty...`);
  const firstNames = ['Maria', 'Jose', 'Juan', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa', 'Miguel', 'Isabel', 'Francisco', 'Dolores', 'Antonio', 'Cristina', 'Manuel', 'Patricia', 'Carlos', 'Elena', 'Javier', 'Mercedes', 'Fernando', 'Laura', 'Diego', 'Sofia', 'Alberto', 'Valentina', 'Ricardo', 'Gabriela', 'Andres', 'Lucia', 'Roberto', 'Victoria', 'Daniel', 'Paula', 'Alejandro', 'Martina', 'Sergio', 'Julia', 'Victor', 'Natalia', 'Hugo', 'Daniela', 'Martin', 'Camila', 'Pablo', 'Valeria', 'Eduardo', 'Mariana', 'Ignacio', 'Luciana'];
  const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Morales', 'Ortiz', 'Cruz', 'Gutierrez', 'Chavez', 'Ruiz', 'Mendoza', 'Aguilar', 'Castillo', 'Vargas', 'Ramos', 'Herrera', 'Medina', 'Silva', 'Romero', 'Moreno', 'Orozco', 'Delgado', 'Vega', 'Rojas', 'Alvarez', 'Sandoval', 'Estrada', 'Santos', 'Navarro', 'Fuentes', 'Cortez', 'Figueroa', 'Espinoza', 'Contreras', 'Marquez', 'Villanueva', 'Castro', 'Soto'];
  const positions = ['Instructor', 'Assistant Professor', 'Associate Professor', 'Professor'];
  const educations = ["Bachelor's Degree", "Master's Degree", 'Doctorate'];
  const fields = ['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'];
  const departments = ['IT', 'CS'];

  const facultyData = [];
  for (let i = 0; i < FACULTY_COUNT; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const empId = `FAC-${2020 + Math.floor(i / 20)}-${String((i % 20) + 1).padStart(3, '0')}`;
    
    facultyData.push({
      employeeId: empId,
      firstName,
      lastName,
      middleName: '',
      dob: `${randomInt(1970, 1995)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      department: randomItem(departments),
      institutionalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomInt(1, 999)}@university.edu.ph`,
      personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomInt(1, 999)}@gmail.com`,
      mobileNumber: `09${randomInt(100000000, 999999999)}`,
      emergencyContactName: `${randomItem(firstNames)} ${lastName}`,
      emergencyContactNumber: `09${randomInt(100000000, 999999999)}`,
      position: randomItem(positions),
      employmentType: randomItem(['Full-time', 'Part-time']),
      contractType: randomItem(['Regular', 'Probationary', 'Contract of Service']),
      dateHired: `${randomInt(2015, 2024)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      status: 'Active',
      highestEducation: randomItem(educations),
      fieldOfStudy: randomItem(fields),
      certifications: randomItem(['AWS Certified', 'Google Cloud Cert', 'Microsoft Cert', 'Cisco Cert', '']),
      specializations: randomItems(specializations, randomInt(1, 3)).map(s => s._id),
      address: { street: faker.location.streetAddress(), city: faker.location.city(), province: faker.location.state(), postalCode: faker.location.zipCode() },
      internalNotes: ''
    });
  }

  const faculty = await Faculty.insertMany(facultyData);
  
  // Create faculty users
  const userData = faculty.map(f => ({
    username: f.employeeId,
    password: 'password',
    name: `${f.firstName} ${f.lastName}`,
    role: 'faculty',
    employeeId: f.employeeId,
    email: f.institutionalEmail,
    isActive: true
  }));
  await User.insertMany(userData);
  
  console.log(`Created ${faculty.length} faculty + users`);
  return faculty;
}

async function seedStudents() {
  console.log(`Seeding ${STUDENT_COUNT} students...`);
  const firstNames = ['John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Joseph', 'Abigail', 'Samuel', 'Emily', 'David', 'Elizabeth', 'Christopher', 'Sofia', 'Andrew', 'Avery', 'Joshua', 'Ella', 'Nicholas', 'Madison', 'Ryan', 'Scarlett', 'Nathan', 'Victoria', 'Ethan', 'Chloe', 'Jacob', 'Grace', 'Logan', 'Zoey', 'Anthony', 'Nora', 'Dylan', 'Lily', 'Gabriel', 'Hannah'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'];
  const programs = ['IT', 'CS'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const scholarships = ['None', 'Academic Scholar', 'Athletic Scholar'];
  const skills = ['JavaScript', 'Python', 'Java', 'C++', 'PHP', 'HTML', 'CSS', 'React', 'Angular', 'Node.js', 'SQL', 'MongoDB'];

  const studentsData = [];
  for (let i = 0; i < STUDENT_COUNT; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const year = randomInt(2020, 2024);
    studentsData.push({
      id: `${year}-${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      gender: randomItem(['Male', 'Female']),
      dob: `${randomInt(1998, 2006)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      program: randomItem(programs),
      yearLevel: randomItem(yearLevels),
      section: '',
      status: 'Active',
      scholarship: randomItem(scholarships),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@student.edu.ph`,
      contact: `09${randomInt(100000000, 999999999)}`,
      dateEnrolled: `${year}-08-15`,
      guardian: `${randomItem(firstNames)} ${lastName}`,
      guardianContact: `09${randomInt(100000000, 999999999)}`,
      violation: 'None',
      skills: randomItems(skills, randomInt(3, 6)),
      address: { street: faker.location.streetAddress(), city: faker.location.city(), province: faker.location.state(), postalCode: faker.location.zipCode() },
      academicHistory: {
        elementary: faker.location.city() + ' Elementary School',
        elementaryAchievements: randomInt(0, 2) > 0 ? ['Honor Student'] : [],
        highSchool: faker.location.city() + ' National High School',
        highSchoolAchievements: randomInt(0, 2) > 0 ? ['Valedictorian'] : []
      }
    });
  }

  // Batch insert
  const BATCH_SIZE = 100;
  for (let i = 0; i < studentsData.length; i += BATCH_SIZE) {
    await Student.insertMany(studentsData.slice(i, i + BATCH_SIZE));
    process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, STUDENT_COUNT)}/${STUDENT_COUNT}`);
  }
  console.log(`\nCreated ${STUDENT_COUNT} students`);
}

async function seedCurricula() {
  console.log('Seeding curricula...');
  const courses = [
    { code: 'IT101', title: 'Intro to Computing', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT102', title: 'Computer Programming 1', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT103', title: 'Computer Programming 2', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT201', title: 'Data Structures', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT202', title: 'Database Systems', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT203', title: 'Web Development', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT301', title: 'Software Engineering', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT302', title: 'Mobile App Dev', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT303', title: 'Cloud Computing', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT304', title: 'Cybersecurity', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT401', title: 'Capstone 1', program: 'IT', units: 3, lec: 1, lab: 6 },
    { code: 'IT402', title: 'Capstone 2', program: 'IT', units: 3, lec: 1, lab: 6 },
    { code: 'CS101', title: 'Discrete Math', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS102', title: 'Computer Org', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS201', title: 'Operating Systems', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS202', title: 'Networks', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS301', title: 'AI', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS302', title: 'Machine Learning', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS303', title: 'Theory of Computation', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS401', title: 'Research Methods', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'GEN101', title: 'Math in Modern World', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN102', title: 'Science & Society', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN103', title: 'Ethics', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN104', title: 'Philippine History', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN105', title: 'Art Appreciation', program: 'General', units: 3, lec: 3, lab: 0 }
  ];

  const curricula = courses.map(c => ({
    courseCode: c.code,
    courseTitle: c.title,
    program: c.program,
    curriculumYear: '2024-2025',
    description: faker.lorem.paragraph(),
    creditUnits: c.units,
    lectureHours: c.lec,
    labHours: c.lab,
    status: 'Active',
    prerequisites: [],
    courseLearningOutcomes: [`Understand ${c.title}`, `Apply ${c.title} principles`, `Demonstrate ${c.title} skills`]
  }));

  return await Curriculum.insertMany(curricula);
}

async function seedRooms() {
  console.log('Seeding rooms...');
  const buildings = ['IT Building', 'Science Building', 'Engineering Building', 'Main Building'];
  const types = ['Lecture', 'IT Lab', 'Biology Lab', 'Multipurpose'];

  const rooms = [];
  for (let i = 1; i <= ROOMS_COUNT; i++) {
    const building = randomItem(buildings);
    const type = randomItem(types);
    rooms.push({
      roomCode: `${building.substring(0, 2).toUpperCase()}${100 + i}`,
      name: `${building} Room ${100 + i}`,
      type,
      maximumCapacity: type === 'IT Lab' ? 30 : 50,
      building,
      status: 'Active',
      description: faker.lorem.sentence()
    });
  }
  return await Room.insertMany(rooms);
}

async function seedTimeBlocks() {
  console.log('Seeding time blocks...');
  const slots = [
    { label: '7:00-9:00 AM', start: '07:00', end: '09:00', duration: 120 },
    { label: '9:00-11:00 AM', start: '09:00', end: '11:00', duration: 120 },
    { label: '11:00-1:00 PM', start: '11:00', end: '13:00', duration: 120 },
    { label: '1:00-3:00 PM', start: '13:00', end: '15:00', duration: 120 },
    { label: '3:00-5:00 PM', start: '15:00', end: '17:00', duration: 120 },
    { label: '5:00-7:00 PM', start: '17:00', end: '19:00', duration: 120 },
    { label: '8:00-11:00 AM', start: '08:00', end: '11:00', duration: 180 },
    { label: '1:00-4:00 PM', start: '13:00', end: '16:00', duration: 180 }
  ];

  const blocks = slots.map(s => ({
    label: s.label,
    durationMinutes: s.duration,
    startTime: s.start,
    endTime: s.end,
    status: 'Active'
  }));

  return await TimeBlock.insertMany(blocks);
}

async function seedSections(students, faculty) {
  console.log('Seeding sections...');
  const programs = ['IT', 'CS'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const terms = ['1st Term', '2nd Term'];

  // Group students
  const groups = {};
  for (const p of programs) {
    groups[p] = {};
    for (const y of yearLevels) groups[p][y] = students.filter(s => s.program === p && s.yearLevel === y);
  }

  const sections = [];
  for (const p of programs) {
    for (const y of yearLevels) {
      for (const t of terms) {
        const available = groups[p][y];
        const count = Math.min(SECTIONS_PER_YEAR, Math.ceil(available.length / 40));
        for (let i = 1; i <= count; i++) {
          const yearCode = { '1st Year': '1', '2nd Year': '2', '3rd Year': '3', '4th Year': '4' }[y];
          const termCode = { '1st Term': 'T1', '2nd Term': 'T2' }[t];
          const prefix = p === 'IT' ? 'BSIT' : 'BSCS';
          sections.push({
            sectionIdentifier: `${prefix}-${yearCode}-${termCode}-${String(i).padStart(2, '0')}`,
            program: p,
            yearLevel: y,
            term: t,
            academicYear: '2024-2025',
            capacity: 55,
            status: 'Active',
            currentEnrollmentCount: 0,
            enrolledStudentIds: [],
            schedules: []
          });
        }
      }
    }
  }

  const created = await Section.insertMany(sections);
  console.log(`Created ${created.length} sections`);

  // Enroll students
  let enrolled = 0;
  for (const section of created) {
    const eligible = students.filter(s => s.program === section.program && s.yearLevel === section.yearLevel);
    const toEnroll = randomItems(eligible, randomInt(30, 50));
    if (toEnroll.length > 0) {
      section.enrolledStudentIds = toEnroll.map(s => s._id);
      section.currentEnrollmentCount = toEnroll.length;
      await section.save();
      enrolled += toEnroll.length;
    }
  }
  console.log(`Enrolled ${enrolled} students`);
  return created;
}

async function seedSchedules(sections, faculty, rooms, timeBlocks, curricula) {
  console.log('Creating schedules...');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  let count = 0;

  for (const section of sections) {
    const numCourses = randomInt(3, 5);
    const sectionCurricula = curricula.filter(c => c.program === section.program || c.program === 'General');
    const selected = randomItems(sectionCurricula, numCourses);
    const schedules = [];

    for (const curriculum of selected) {
      const startHour = randomInt(7, 16);
      schedules.push({
        curriculumId: curriculum._id,
        facultyId: randomItem(faculty)._id,
        roomId: randomItem(rooms)._id,
        dayOfWeek: randomItem(days),
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + randomInt(2, 3)).padStart(2, '0')}:00`,
        academicYear: '2024-2025',
        term: section.term
      });
      count++;
    }
    section.schedules = schedules;
    await section.save();
  }
  console.log(`Created ${count} schedules`);
}

async function seedSyllabi(sections, curricula, faculty) {
  console.log('Seeding syllabi...');
  const syllabi = [];

  for (const section of sections) {
    if (!section.schedules?.length) continue;
    for (const schedule of section.schedules) {
      const curriculum = curricula.find(c => c._id.toString() === (schedule.curriculumId?._id?.toString() || schedule.curriculumId?.toString()));
      if (!curriculum) continue;

      const assignedFaculty = faculty.find(f => f._id.toString() === (schedule.facultyId?._id?.toString() || schedule.facultyId?.toString())) || randomItem(faculty);
      
      const weeklyLessons = [];
      for (let week = 1; week <= randomInt(12, 16); week++) {
        weeklyLessons.push({
          weekNumber: week,
          topic: `Week ${week}: ${faker.lorem.words(3)}`,
          objectives: ['Understand concepts', 'Apply knowledge', 'Demonstrate skills'],
          materials: ['Textbook', 'Slides'],
          assessments: 'Quiz, Assignment',
          status: week <= 8 ? 'Delivered' : 'Pending'
        });
      }

      syllabi.push({
        curriculumId: curriculum._id,
        facultyId: assignedFaculty._id,
        sectionId: section._id,
        description: faker.lorem.paragraphs(2),
        gradingSystem: JSON.stringify({ quizzes: 20, assignments: 20, midterm: 30, finals: 30 }),
        coursePolicies: 'Attendance mandatory. Late work penalized.',
        weeklyLessons,
        status: 'Active'
      });
    }
  }

  for (let i = 0; i < syllabi.length; i += 50) {
    await Syllabus.insertMany(syllabi.slice(i, i + 50));
    process.stdout.write(`\rProgress: ${Math.min(i + 50, syllabi.length)}/${syllabi.length}`);
  }
  console.log(`\nCreated ${syllabi.length} syllabi`);
}

async function seedEvents(rooms) {
  console.log('Seeding events...');
  const titles = ['Welcome Orientation', 'Career Fair', 'Tech Summit', 'Hackathon', 'Research Symposium', 'Alumni Homecoming', 'Sports Festival', 'Cultural Night', 'Leadership Seminar', 'Job Fair', 'Academic Day', 'Foundation Day', 'Christmas Party', 'Graduation', 'Summer Workshop', 'Industry Talk', 'Project Exhibition', 'Coding Competition', 'Networking Night', 'Mentorship'];
  const types = ['Curricular', 'Extra-Curricular', 'Other'];

  const events = [];
  for (let i = 0; i < EVENTS_COUNT; i++) {
    const date = faker.date.future({ years: 1 });
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(end.getHours() + randomInt(2, 8));

    events.push({
      title: randomItem(titles),
      type: randomItem(types),
      status: randomItem(['draft', 'pending_approval', 'published']),
      schedule: { date, startTime: start, endTime: end },
      timezone: 'Asia/Manila',
      isVirtual: false,
      roomId: randomItem(rooms)._id,
      targetGroups: { roles: ['student', 'faculty'], programs: ['IT', 'CS'], yearLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year'] }
    });
  }

  await Event.insertMany(events);
  console.log(`Created ${events.length} events`);
}

async function seedAdmin() {
  console.log('Creating admin user...');
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  
  await User.deleteOne({ username: 'admin' });
  await User.create({
    username: 'admin',
    password: password, // Will be hashed by User model pre-save hook
    name: 'System Admin',
    role: 'admin',
    email: 'admin@university.edu.ph',
    isActive: true
  });
  console.log('Admin created (username: admin, password: ' + password + ')');
}

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ccs_profiling');
    console.log('Connected');

    await clearCollections();
    console.log('\n=== Seeding Data ===\n');

    const specializations = await seedSpecializations();
    const faculty = await seedFaculty(specializations);
    await seedStudents();
    const students = await Student.find();
    const curricula = await seedCurricula();
    const rooms = await seedRooms();
    const timeBlocks = await seedTimeBlocks();
    const sections = await seedSections(students, faculty);
    await seedSchedules(sections, faculty, rooms, timeBlocks, curricula);
    await seedSyllabi(sections, curricula, faculty);
    await seedEvents(rooms);
    await seedAdmin();

    console.log('\n=== Seeding Complete ===');
    console.log('Summary:');
    console.log(`- Specializations: ${specializations.length}`);
    console.log(`- Faculty: ${faculty.length}`);
    console.log(`- Students: ${STUDENT_COUNT}`);
    console.log(`- Curricula: ${curricula.length}`);
    console.log(`- Rooms: ${rooms.length}`);
    console.log(`- Time Blocks: ${timeBlocks.length}`);
    console.log(`- Sections: ${sections.length}`);
    console.log(`- Events: ${EVENTS_COUNT}`);
    console.log('- Admin: 1 (username: admin)');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

main();
