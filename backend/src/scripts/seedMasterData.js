/**
 * Master Data Seeder
 * Seeds comprehensive test data with all entities interconnected:
 * - 1000 Students
 * - 50 Faculty
 * - Specializations, Curricula, Rooms, Time Blocks
 * - Sections with enrolled students and assigned faculty
 * - Schedules linking everything together
 * - Syllabi
 * - Events
 */

require('dotenv').config();
const mongoose = require('mongoose');
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
const CURRICULA_COUNT = 30;
const ROOMS_COUNT = 15;
const EVENTS_COUNT = 20;

// Helper functions
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStudentNumber(index) {
  const year = randomInt(2020, 2024);
  const sequence = String(index + 1).padStart(4, '0');
  return `${year}-${sequence}`;
}

function generateEmployeeId(index) {
  const year = 2020 + Math.floor(index / 20);
  const sequence = String((index % 20) + 1).padStart(3, '0');
  return `FAC-${year}-${sequence}`;
}

function generateSectionIdentifier(program, yearLevel, term, sectionNum) {
  const prefixes = { IT: 'BSIT', CS: 'BSCS', General: 'GEN' };
  const yearCodes = { '1st Year': '1', '2nd Year': '2', '3rd Year': '3', '4th Year': '4' };
  const termCodes = { '1st Term': 'T1', '2nd Term': 'T2', 'Summer': 'SU' };
  const prefix = prefixes[program] || 'SEC';
  const yearCode = yearCodes[yearLevel] || '1';
  const termCode = termCodes[term] || 'T1';
  return `${prefix}-${yearCode}-${termCode}-${String(sectionNum).padStart(2, '0')}`;
}

async function clearExistingData() {
  console.log('Clearing existing data...');
  
  // Clear each collection individually with error handling
  const models = [
    { name: 'Students', model: Student },
    { name: 'Syllabi', model: Syllabus || null },
    { name: 'Sections', model: Section },
    { name: 'Faculty', model: Faculty },
    { name: 'Users', model: User },
    { name: 'Specializations', model: Specialization },
    { name: 'Curricula', model: Curriculum },
    { name: 'Rooms', model: Room },
    { name: 'TimeBlocks', model: TimeBlock },
    { name: 'Events', model: Event }
  ];
  
  for (const { name, model } of models) {
    try {
      if (model && typeof model.deleteMany === 'function') {
        const result = await model.deleteMany({});
        console.log(`  Cleared ${result.deletedCount} ${name}`);
      } else {
        console.log(`  Skipped ${name} (model not properly loaded)`);
      }
    } catch (err) {
      console.log(`  Error clearing ${name}: ${err.message}`);
    }
  }
  console.log('Data clearing complete.');
}

async function seedSpecializations() {
  console.log('Seeding specializations...');
  
  const specializations = [
    {
      name: 'Web Development',
      description: 'Front-end and back-end web technologies',
      relatedSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
      careerPaths: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer']
    },
    {
      name: 'Mobile Development',
      description: 'iOS and Android mobile application development',
      relatedSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
      careerPaths: ['Mobile Developer', 'iOS Developer', 'Android Developer']
    },
    {
      name: 'Data Science',
      description: 'Data analysis, machine learning, and AI',
      relatedSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
      careerPaths: ['Data Scientist', 'Data Analyst', 'ML Engineer']
    },
    {
      name: 'Cybersecurity',
      description: 'Network security and ethical hacking',
      relatedSkills: ['Network Security', 'Penetration Testing', 'Cryptography'],
      careerPaths: ['Security Analyst', 'Ethical Hacker', 'Security Engineer']
    },
    {
      name: 'Cloud Computing',
      description: 'Cloud infrastructure and DevOps',
      relatedSkills: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD'],
      careerPaths: ['Cloud Engineer', 'DevOps Engineer', 'SRE']
    },
    {
      name: 'Database Management',
      description: 'Database design and administration',
      relatedSkills: ['SQL', 'PostgreSQL', 'MongoDB', 'Database Design'],
      careerPaths: ['Database Administrator', 'Data Engineer']
    }
  ];

  return await Specialization.insertMany(specializations);
}

async function seedFaculty(specializationsDocs) {
  console.log(`Seeding ${FACULTY_COUNT} faculty members...`);
  
  const firstNames = [
    'Maria', 'Jose', 'Juan', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa',
    'Miguel', 'Isabel', 'Francisco', 'Dolores', 'Antonio', 'Cristina',
    'Manuel', 'Patricia', 'Carlos', 'Elena', 'Javier', 'Mercedes',
    'Fernando', 'Laura', 'Diego', 'Sofia', 'Alberto', 'Valentina',
    'Ricardo', 'Gabriela', 'Andres', 'Lucia', 'Roberto', 'Victoria',
    'Daniel', 'Paula', 'Alejandro', 'Martina', 'Sergio', 'Julia',
    'Victor', 'Natalia', 'Hugo', 'Daniela', 'Martin', 'Camila',
    'Pablo', 'Valeria', 'Eduardo', 'Mariana', 'Ignacio', 'Luciana'
  ];
  
  const lastNames = [
    'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez',
    'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez',
    'Diaz', 'Reyes', 'Morales', 'Ortiz', 'Cruz', 'Gutierrez',
    'Chavez', 'Ruiz', 'Mendoza', 'Aguilar', 'Castillo', 'Vargas',
    'Ramos', 'Herrera', 'Medina', 'Silva', 'Romero', 'Moreno',
    'Orozco', 'Delgado', 'Vega', 'Rojas', 'Alvarez', 'Sandoval',
    'Estrada', 'Santos', 'Navarro', 'Fuentes', 'Cortez', 'Figueroa',
    'Espinoza', 'Contreras', 'Marquez', 'Villanueva', 'Castro', 'Soto'
  ];

  const positions = ['Instructor', 'Assistant Professor', 'Associate Professor', 'Professor'];
  const educations = ['Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate'];
  const fieldsOfStudy = ['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'];
  const departments = ['IT', 'CS'];

  const facultyData = [];
  const usersData = [];

  for (let i = 0; i < FACULTY_COUNT; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const employeeId = generateEmployeeId(i);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu.ph`;
    
    // Get 1-3 random specializations as ObjectIds
    const facultySpecs = randomItems(specializationsDocs, randomInt(1, 3)).map(s => s._id);
    
    // Generate dates in YYYY-MM-DD format
    const hireYear = randomInt(2015, 2024);
    const hireMonth = String(randomInt(1, 12)).padStart(2, '0');
    const hireDay = String(randomInt(1, 28)).padStart(2, '0');
    const dateHired = `${hireYear}-${hireMonth}-${hireDay}`;
    
    const birthYear = randomInt(1970, 1995);
    const birthMonth = String(randomInt(1, 12)).padStart(2, '0');
    const birthDay = String(randomInt(1, 28)).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;
    
    facultyData.push({
      employeeId,
      firstName,
      lastName,
      dob,
      department: randomItem(departments),
      institutionalEmail: email,
      personalEmail: email,
      mobileNumber: `09${randomInt(100000000, 999999999)}`,
      emergencyContactName: `${randomItem(firstNames)} ${lastName}`,
      emergencyContactNumber: `09${randomInt(100000000, 999999999)}`,
      position: randomItem(positions),
      employmentType: randomItem(['Full-time', 'Part-time']),
      contractType: randomItem(['Regular', 'Probationary', 'Contract of Service']),
      dateHired,
      status: 'Active',
      highestEducation: randomItem(educations),
      fieldOfStudy: randomItem(fieldsOfStudy),
      certifications: randomItem(['AWS Certified', 'Google Cloud Cert', 'Microsoft Cert', 'Cisco Cert', '']),
      specializations: facultySpecs,
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        postalCode: faker.location.zipCode()
      }
    });
  }

  const faculty = await Faculty.insertMany(facultyData);
  
  // Create users for faculty
  for (const f of faculty) {
    usersData.push({
      username: f.employeeId,
      email: f.institutionalEmail,
      password: 'password', // will be hashed by pre-save hook
      role: 'faculty',
      employeeId: f.employeeId,
      name: `${f.firstName} ${f.lastName}`,
      isActive: true
    });
  }

  await User.insertMany(usersData);
  console.log(`Created ${faculty.length} faculty and users.`);
  
  return faculty;
}

async function seedStudents(count = STUDENT_COUNT) {
  console.log(`Seeding ${count} students...`);
  
  const firstNames = [
    'John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava',
    'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander',
    'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Joseph', 'Abigail',
    'Samuel', 'Emily', 'David', 'Elizabeth', 'Christopher', 'Sofia', 'Andrew',
    'Avery', 'Joshua', 'Ella', 'Nicholas', 'Madison', 'Ryan', 'Scarlett',
    'Nathan', 'Victoria', 'Ethan', 'Chloe', 'Jacob', 'Grace', 'Logan', 'Zoey',
    'Anthony', 'Nora', 'Dylan', 'Lily', 'Gabriel', 'Hannah'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'
  ];

  const programs = ['IT', 'CS'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const scholarships = ['None', 'Academic Scholar', 'Athletic Scholar', 'Working Scholar'];
  const genders = ['Male', 'Female'];
  const skillsPool = [
    'JavaScript', 'Python', 'Java', 'C++', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Laravel',
    'SQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Git', 'Linux', 'Windows'
  ];

  const studentsData = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const program = randomItem(programs);
    const yearLevel = randomItem(yearLevels);
    
    studentsData.push({
      id: generateStudentNumber(i),
      firstName,
      lastName,
      gender: randomItem(genders),
      dob: `${randomInt(1998, 2006)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      program,
      yearLevel,
      section: '',
      status: 'Active',
      scholarship: randomItem(scholarships),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@student.edu.ph`,
      contact: `09${randomInt(100000000, 999999999)}`,
      dateEnrolled: `${randomInt(2020, 2024)}-08-15`,
      guardian: `${randomItem(firstNames)} ${lastName}`,
      guardianContact: `09${randomInt(100000000, 999999999)}`,
      violation: 'None',
      skills: randomItems(skillsPool, randomInt(3, 8)),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        postalCode: faker.location.zipCode()
      },
      academicHistory: {
        elementary: faker.location.city() + ' Elementary School',
        elementaryAchievements: randomInt(0, 3) > 0 ? ['Honor Student', 'Science Fair Winner'] : [],
        highSchool: faker.location.city() + ' National High School',
        highSchoolAchievements: randomInt(0, 3) > 0 ? ['Valedictorian', 'Best in Math'] : []
      }
    });
  }

  // Batch insert in chunks to avoid memory issues
  const CHUNK_SIZE = 100;
  const students = [];
  
  for (let i = 0; i < studentsData.length; i += CHUNK_SIZE) {
    const chunk = studentsData.slice(i, i + CHUNK_SIZE);
    const result = await Student.insertMany(chunk);
    students.push(...result);
    process.stdout.write(`\rProgress: ${Math.min(i + CHUNK_SIZE, count)}/${count}`);
  }
  console.log(`\nCreated ${students.length} students.`);
  
  return students;
}

async function seedCurricula() {
  console.log('Seeding curricula...');
  
  const courses = [
    { code: 'IT101', title: 'Introduction to Computing', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT102', title: 'Computer Programming 1', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT103', title: 'Computer Programming 2', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT201', title: 'Data Structures and Algorithms', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT202', title: 'Database Management Systems', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT203', title: 'Web Development', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT301', title: 'Software Engineering', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT302', title: 'Mobile Application Development', program: 'IT', units: 3, lec: 2, lab: 3 },
    { code: 'IT303', title: 'Cloud Computing', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT304', title: 'Cybersecurity Fundamentals', program: 'IT', units: 3, lec: 3, lab: 0 },
    { code: 'IT401', title: 'Capstone Project 1', program: 'IT', units: 3, lec: 1, lab: 6 },
    { code: 'IT402', title: 'Capstone Project 2', program: 'IT', units: 3, lec: 1, lab: 6 },
    { code: 'CS101', title: 'Discrete Mathematics', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS102', title: 'Computer Organization', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS201', title: 'Operating Systems', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS202', title: 'Computer Networks', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS301', title: 'Artificial Intelligence', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS302', title: 'Machine Learning', program: 'CS', units: 3, lec: 2, lab: 3 },
    { code: 'CS303', title: 'Theory of Computation', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'CS401', title: 'Research Methods', program: 'CS', units: 3, lec: 3, lab: 0 },
    { code: 'GEN101', title: 'Mathematics in the Modern World', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN102', title: 'Science, Technology and Society', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN103', title: 'Ethics', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN104', title: 'Reading in Philippine History', program: 'General', units: 3, lec: 3, lab: 0 },
    { code: 'GEN105', title: 'Art Appreciation', program: 'General', units: 3, lec: 3, lab: 0 }
  ];

  const curriculaData = courses.map(c => ({
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
    courseLearningOutcomes: [
      `Understand fundamental concepts of ${c.title}`,
      `Apply ${c.title} principles to solve problems`,
      `Demonstrate proficiency in ${c.title} tools and techniques`
    ]
  }));

  const curricula = await Curriculum.insertMany(curriculaData);
  console.log(`Created ${curricula.length} curricula.`);
  
  return curricula;
}

async function seedRooms() {
  console.log('Seeding rooms...');
  
  const buildings = ['IT Building', 'Science Building', 'Engineering Building', 'Main Building'];
  const ROOM_TYPES = ['Lecture', 'IT Lab', 'Biology Lab', 'Multipurpose'];
  
  const roomsData = [];
  
  for (let i = 1; i <= ROOMS_COUNT; i++) {
    const building = randomItem(buildings);
    const roomNum = 100 + i;
    const type = randomItem(ROOM_TYPES);
    
    roomsData.push({
      name: `${building} Room ${roomNum}`,
      roomCode: `${building.substring(0, 2).toUpperCase()}${roomNum}`,
      type,
      maximumCapacity: type === 'IT Lab' ? 30 : 50,
      building,
      status: 'Active',
      description: faker.lorem.sentence()
    });
  }

  const rooms = await Room.insertMany(roomsData);
  console.log(`Created ${rooms.length} rooms.`);
  
  return rooms;
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

  const timeBlocksData = [];
  
  for (const slot of slots) {
    timeBlocksData.push({
      label: slot.label,
      durationMinutes: slot.duration,
      startTime: slot.start,
      endTime: slot.end,
      status: 'Active'
    });
  }

  const timeBlocks = await TimeBlock.insertMany(timeBlocksData);
  console.log(`Created ${timeBlocks.length} time blocks.`);
  
  return timeBlocks;
}

async function seedSections(students, faculty) {
  console.log('Seeding sections with enrolled students...');
  
  const programs = ['IT', 'CS'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const terms = ['1st Term', '2nd Term'];
  const academicYear = '2024-2025';
  
  const sectionsData = [];
  let sectionNum = 1;
  
  // Group students by program and year level
  const studentGroups = {};
  for (const program of programs) {
    studentGroups[program] = {};
    for (const year of yearLevels) {
      studentGroups[program][year] = students.filter(s => 
        s.program === program && s.yearLevel === year
      );
    }
  }

  // Create sections for each program/year/term combination
  for (const program of programs) {
    for (const year of yearLevels) {
      for (const term of terms) {
        const availableStudents = studentGroups[program][year];
        const numSections = Math.min(SECTIONS_PER_YEAR, Math.ceil(availableStudents.length / 40));
        
        for (let i = 1; i <= numSections; i++) {
          sectionsData.push({
            sectionIdentifier: generateSectionIdentifier(program, year, term, i),
            program,
            yearLevel: year,
            term,
            academicYear,
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

  const sections = await Section.insertMany(sectionsData);
  console.log(`Created ${sections.length} sections.`);
  
  // Enroll students in sections
  console.log('Enrolling students in sections...');
  let enrolledCount = 0;
  
  for (const section of sections) {
    const eligibleStudents = students.filter(s => 
      s.program === section.program && 
      s.yearLevel === section.yearLevel
    );
    
    // Enroll 30-50 students per section
    const targetEnrollment = randomInt(30, 50);
    const studentsToEnroll = eligibleStudents
      .sort(() => 0.5 - Math.random())
      .slice(0, targetEnrollment);
    
    if (studentsToEnroll.length > 0) {
      section.enrolledStudentIds = studentsToEnroll.map(s => s._id);
      section.currentEnrollmentCount = studentsToEnroll.length;
      await section.save();
      enrolledCount += studentsToEnroll.length;
    }
  }
  
  console.log(`Enrolled ${enrolledCount} students across all sections.`);
  
  return sections;
}

async function seedSchedules(sections, faculty, rooms, timeBlocks, curricula) {
  console.log('Creating schedules for sections...');
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const academicYear = '2024-2025';
  let scheduleCount = 0;
  
  for (const section of sections) {
    // Assign 3-5 courses per section
    const numCourses = randomInt(3, 5);
    const sectionCurricula = curricula.filter(c => 
      c.program === section.program || c.program === 'General'
    );
    
    const selectedCurricula = randomItems(sectionCurricula, numCourses);
    const schedules = [];
    
    for (const curriculum of selectedCurricula) {
      // Pick a random faculty member
      const assignedFaculty = randomItem(faculty);
      
      // Pick a random room
      const assignedRoom = randomItem(rooms);
      
      // Pick random day and time
      const day = randomItem(days);
      const startHour = randomInt(7, 16);
      const endHour = startHour + randomInt(2, 3);
      
      schedules.push({
        curriculumId: curriculum._id,
        facultyId: assignedFaculty._id,
        roomId: assignedRoom._id,
        dayOfWeek: day,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(endHour).padStart(2, '0')}:00`,
        academicYear: section.academicYear,
        term: section.term
      });
      
      scheduleCount++;
    }
    
    section.schedules = schedules;
    await section.save();
  }
  
  console.log(`Created ${scheduleCount} schedules across all sections.`);
  return scheduleCount;
}

async function seedSyllabi(sections, curricula, faculty) {
  console.log('Seeding syllabi...');
  
  const syllabiData = [];
  
  for (const section of sections) {
    if (!section.schedules || section.schedules.length === 0) continue;
    
    for (const schedule of section.schedules) {
      const curriculum = curricula.find(c => 
        c._id.toString() === (schedule.curriculumId?._id?.toString() || schedule.curriculumId?.toString())
      );
      
      if (!curriculum) continue;
      
      const assignedFaculty = faculty.find(f => 
        f._id.toString() === (schedule.facultyId?._id?.toString() || schedule.facultyId?.toString())
      ) || randomItem(faculty);
      
      const numWeeks = randomInt(12, 16);
      const weeklyLessons = [];
      
      for (let week = 1; week <= numWeeks; week++) {
        weeklyLessons.push({
          weekNumber: week,
          topic: `Week ${week}: ${faker.lorem.words(3)}`,
          objectives: [
            'Understand key concepts',
            'Apply theoretical knowledge',
            'Demonstrate practical skills'
          ],
          materials: ['Textbook', 'Online Materials'],
          assessments: 'Quiz, Assignment, Participation',
          status: week <= 8 ? 'Delivered' : 'Pending',
          deliveredAt: week <= 8 ? faker.date.recent({ days: 60 }) : null
        });
      }
      
      syllabiData.push({
        curriculumId: curriculum._id,
        facultyId: assignedFaculty._id,
        sectionId: section._id,
        description: faker.lorem.paragraphs(2),
        gradingSystem: JSON.stringify({
          quizzes: 20,
          assignments: 20,
          midterm: 30,
          finals: 30
        }),
        coursePolicies: 'Attendance is mandatory. Late submissions penalized.',
        weeklyLessons,
        status: 'Active'
      });
    }
  }

  // Batch insert syllabi
  const CHUNK_SIZE = 50;
  let createdCount = 0;
  
  for (let i = 0; i < syllabiData.length; i += CHUNK_SIZE) {
    const chunk = syllabiData.slice(i, i + CHUNK_SIZE);
    await Syllabus.insertMany(chunk);
    createdCount += chunk.length;
    process.stdout.write(`\rProgress: ${createdCount}/${syllabiData.length}`);
  }
  
  console.log(`\nCreated ${createdCount} syllabi.`);
  return createdCount;
}

async function seedEvents(rooms) {
  console.log('Seeding events...');
  
  const eventTypes = ['Curricular', 'Extra-Curricular', 'Other'];
  const eventTitles = [
    'Welcome Orientation', 'Career Fair', 'Tech Summit', 'Hackathon',
    'Research Symposium', 'Alumni Homecoming', 'Sports Festival',
    'Cultural Night', 'Leadership Seminar', 'Job Fair',
    'Academic Recognition Day', 'Foundation Day', 'Christmas Party',
    'Graduation Ceremony', 'Summer Workshop', 'Industry Talk',
    'Project Exhibition', 'Coding Competition', 'Networking Night',
    'Mentorship Program'
  ];
  
  const eventsData = [];
  
  for (let i = 0; i < EVENTS_COUNT; i++) {
    const eventDate = faker.date.future({ years: 1 });
    const startTime = new Date(eventDate);
    const endTime = new Date(eventDate);
    endTime.setHours(endTime.getHours() + randomInt(2, 8));
    
    eventsData.push({
      title: randomItem(eventTitles),
      type: randomItem(eventTypes),
      status: randomItem(['draft', 'pending_approval', 'published']),
      schedule: {
        date: eventDate,
        startTime: startTime,
        endTime: endTime
      },
      timezone: 'Asia/Manila',
      isVirtual: false,
      roomId: randomItem(rooms)._id,
      targetGroups: {
        roles: ['student', 'faculty'],
        programs: ['IT', 'CS'],
        yearLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year']
      }
    });
  }

  const events = await Event.insertMany(eventsData);
  console.log(`Created ${events.length} events.`);
  
  return events;
}

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ccs_profiling');
    console.log('Connected to MongoDB.');

    // Clear existing data
    await clearExistingData();

    // Seed in order of dependencies
    console.log('\n=== Starting Data Seeding ===\n');
    
    // 1. Seed specializations first (no dependencies)
    const specializations = await seedSpecializations();
    
    // 2. Seed faculty (needs specializations for reference)
    const faculty = await seedFaculty(specializations);
    
    // 3. Seed students
    const students = await seedStudents();
    
    // 4. Seed curricula
    const curricula = await seedCurricula();
    
    // 5. Seed rooms
    const rooms = await seedRooms();
    
    // 6. Seed time blocks
    const timeBlocks = await seedTimeBlocks();
    
    // 7. Seed sections with enrolled students
    const sections = await seedSections(students, faculty);
    
    // 8. Create schedules (links sections, faculty, rooms, curricula)
    await seedSchedules(sections, faculty, rooms, timeBlocks, curricula);
    
    // 9. Seed syllabi (links curricula, faculty, sections)
    await seedSyllabi(sections, curricula, faculty);
    
    // 10. Seed events
    await seedEvents(rooms);

    console.log('\n=== Data Seeding Complete ===');
    console.log('\nSummary:');
    console.log(`- Specializations: ${specializations.length}`);
    console.log(`- Faculty: ${faculty.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Curricula: ${curricula.length}`);
    console.log(`- Rooms: ${rooms.length}`);
    console.log(`- Time Blocks: ${timeBlocks.length}`);
    console.log(`- Sections: ${sections.length}`);
    console.log(`- Events: ${EVENTS_COUNT}`);
    
    console.log('\nAll data is interconnected:');
    console.log('- Sections have enrolled students and assigned faculty');
    console.log('- Schedules link sections to faculty, rooms, and curricula');
    console.log('- Syllabi are connected to curricula, faculty, and sections');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the seeder
main();
