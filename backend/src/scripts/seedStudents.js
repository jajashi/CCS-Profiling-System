/**
 * One-time seed: inserts mock students matching the frontend mock data.
 * Run: npm run seed (from backend directory, with .env and MongoDB available).
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const SEED_ID_FIRST = 2201001;

const MOCK_STUDENTS = [
  {
    firstName: "Jan Earl",
    middleName: "Eclarinal",
    lastName: "Olivar",
    gender: "Male",
    dob: "2004-05-15",
    program: "BSCS",
    yearLevel: "3",
    section: "3CSA",
    status: "Enrolled",
    scholarship: "Full Scholar",
    email: "janearl.olivar@ccs.edu",
    contact: "09175550001",
    dateEnrolled: "2022-08-15",
    guardian: "Maria Olivar",
    guardianContact: "09175551122",
    violation: "None",
    skills: ["Fullstack Development", "Project Management"],
  },
  {
    firstName: "Eden",
    middleName: "Santos",
    lastName: "Nataya",
    gender: "Female",
    dob: "2004-01-20",
    program: "BSIT",
    yearLevel: "2",
    section: "2ITA",
    status: "Enrolled",
    scholarship: "Dean's Lister",
    email: "eden.nataya@ccs.edu",
    contact: "09175550002",
    dateEnrolled: "2023-08-12",
    guardian: "Leo Nataya",
    guardianContact: "09175553344",
    violation: "None",
    skills: ["UI/UX Design", "Graphic Arts", "Creative Writing"],
  },
  {
    firstName: "Jan Rhen",
    middleName: "",
    lastName: "Garcia",
    gender: "Male",
    dob: "2004-02-10",
    program: "BSCS",
    yearLevel: "1",
    section: "1CSA",
    status: "Enrolled",
    scholarship: "None",
    email: "janrhen.garcia@ccs.edu",
    contact: "09175551003",
    dateEnrolled: "2024-08-23",
    guardian: "Maricar Garcia",
    guardianContact: "09175558833",
    violation: "None",
    skills: ["Programming", "UI/UX Design"],
  },
  {
    firstName: "Justin",
    middleName: "Aquino",
    lastName: "Aquilizan",
    gender: "Male",
    dob: "2003-03-30",
    program: "BSIT",
    yearLevel: "4",
    section: "4ITA",
    status: "Enrolled",
    scholarship: "None",
    email: "justin.aquilizan@ccs.edu",
    contact: "09175551004",
    dateEnrolled: "2024-08-23",
    guardian: "Maria Aquilizan",
    guardianContact: "09175558833",
    violation: "None",
    skills: ["Leadership", "Communication", "Problem Solving"],
  },
  {
    firstName: "Jarsha Dazzle",
    middleName: "",
    lastName: "Acu",
    gender: "Female",
    dob: "2003-01-15",
    program: "BSIT",
    yearLevel: "4",
    section: "4ITB",
    status: "Enrolled",
    scholarship: "CHED Scholar",
    email: "jarsha.acu@ccs.edu",
    contact: "09175551005",
    dateEnrolled: "2022-08-22",
    guardian: "Carlos Acu",
    guardianContact: "09175552288",
    violation: "Warning (late)",
    skills: ["Web Development", "Database Management", "Programming"],
  },
  {
    firstName: "Franco",
    middleName: "",
    lastName: "Garcia",
    gender: "Male",
    dob: "2003-09-08",
    program: "BSCS",
    yearLevel: "4",
    section: "4CSB",
    status: "Enrolled",
    scholarship: "None",
    email: "franco.garcia@ccs.edu",
    contact: "09175551006",
    dateEnrolled: "2021-08-20",
    guardian: "Norma Garcia",
    guardianContact: "09175556699",
    violation: "Academic probation",
    skills: ["Programming", "Data Analysis"],
  },
  {
    firstName: "Giselle",
    middleName: "Patricia",
    lastName: "Chua",
    gender: "Female",
    dob: "2005-04-27",
    program: "BSCS",
    yearLevel: "2",
    section: "2CSB",
    status: "Enrolled",
    scholarship: "Academic Scholar",
    email: "giselle.chua@ccs.edu",
    contact: "09177778800",
    dateEnrolled: "2023-08-21",
    guardian: "Patricia Chua",
    guardianContact: "09177778800",
    violation: "None",
    skills: ["UI/UX Design", "Communication", "Leadership"],
  },
  {
    firstName: "Hans",
    middleName: "",
    lastName: "Uy",
    gender: "Male",
    dob: "2004-06-02",
    program: "BSIT",
    yearLevel: "3",
    section: "3ITC",
    status: "Enrolled",
    scholarship: "Industry Partner",
    email: "hans.uy@ccs.edu",
    contact: "09175551008",
    dateEnrolled: "2022-08-22",
    guardian: "Erica Uy",
    guardianContact: "09175556622",
    violation: "None",
    skills: ["Web Development", "Programming", "Database Management"],
  },
  {
    firstName: "Isabel",
    middleName: "Victoria",
    lastName: "Cruz",
    gender: "Female",
    dob: "2005-12-10",
    program: "BSIT",
    yearLevel: "2",
    section: "2ITB",
    status: "Enrolled",
    scholarship: "None",
    email: "isabel.cruz@ccs.edu",
    contact: "09175551009",
    dateEnrolled: "2023-08-21",
    guardian: "Vicente Cruz",
    guardianContact: "09175555577",
    violation: "None",
    skills: ["Data Analysis", "Communication"],
  },
  {
    firstName: "Javier",
    middleName: "Santiago",
    lastName: "Delos Reyes",
    gender: "Male",
    dob: "2003-10-19",
    program: "BSCS",
    yearLevel: "4",
    section: "4CSC",
    status: "Graduating",
    scholarship: "None",
    email: "javier.delosreyes@ccs.edu",
    contact: "09175551010",
    dateEnrolled: "2021-08-20",
    guardian: "Sara Delos Reyes",
    guardianContact: "09175553344",
    violation: "None",
    skills: ["Programming", "Leadership", "Problem Solving", "Web Development"],
  },
  {
    firstName: "Katrina",
    middleName: "",
    lastName: "Mendoza",
    gender: "Female",
    dob: "2006-03-22",
    program: "BSIT",
    yearLevel: "1",
    section: "1ITB",
    status: "Enrolled",
    scholarship: "None",
    email: "katrina.mendoza@ccs.edu",
    contact: "09175551011",
    dateEnrolled: "2024-08-23",
    guardian: "Antonio Mendoza",
    guardianContact: "09175551122",
    violation: "None",
    skills: ["Communication", "Leadership"],
  },
  {
    firstName: "Miguel",
    middleName: "Antonio",
    lastName: "Santos",
    gender: "Male",
    dob: "2004-08-14",
    program: "BSCS",
    yearLevel: "3",
    section: "3CSB",
    status: "Enrolled",
    scholarship: "Academic Scholar",
    email: "miguel.santos@ccs.edu",
    contact: "09175551012",
    dateEnrolled: "2022-08-22",
    guardian: "Rosa Santos",
    guardianContact: "09175552233",
    violation: "None",
    skills: ["Problem Solving", "Data Analysis", "Communication"],
  },
  {
    firstName: "Nicole",
    middleName: "",
    lastName: "Torres",
    gender: "Female",
    dob: "2005-05-30",
    program: "BSIT",
    yearLevel: "2",
    section: "2ITC",
    status: "Enrolled",
    scholarship: "Dean's Lister",
    email: "nicole.torres@ccs.edu",
    contact: "09175551013",
    dateEnrolled: "2023-08-21",
    guardian: "Benjamin Torres",
    guardianContact: "09175553344",
    violation: "None",
    skills: ["UI/UX Design", "Web Development", "Programming"],
  },
  {
    firstName: "Oscar",
    middleName: "Daniel",
    lastName: "Ramos",
    gender: "Male",
    dob: "2003-12-05",
    program: "BSCS",
    yearLevel: "4",
    section: "4CSA",
    status: "Graduating",
    scholarship: "CHED Scholar",
    email: "oscar.ramos@ccs.edu",
    contact: "09175551014",
    dateEnrolled: "2021-08-20",
    guardian: "Diana Ramos",
    guardianContact: "09175554455",
    violation: "None",
    skills: [
      "Programming",
      "Database Management",
      "Data Analysis",
      "Problem Solving",
    ],
  },
  {
    firstName: "Patricia",
    middleName: "Carmen",
    lastName: "Gonzales",
    gender: "Female",
    dob: "2006-01-18",
    program: "BSIT",
    yearLevel: "1",
    section: "1ITC",
    status: "Enrolled",
    scholarship: "None",
    email: "patricia.gonzales@ccs.edu",
    contact: "09175551015",
    dateEnrolled: "2024-08-23",
    guardian: "Carmen Gonzales",
    guardianContact: "09175555566",
    violation: "None",
    skills: ["Communication", "UI/UX Design"],
  },
];

function assignSequentialIds(rows) {
  return rows.map((row, i) => ({
    ...row,
    id: String(SEED_ID_FIRST + i),
  }));
}

const MOCK_COUNT = MOCK_STUDENTS.length;

// Helper function to generate random student data (`sequenceIndex` is 0-based global index into full seed list)
function generateRandomStudent(sequenceIndex) {
  const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Sofia", "Miguel", "Isabella", "Carlos", "Gabriela",
    "Antonio", "Carmen", "Francisco", "Rosa", "Luis", "Teresa", "Javier", "Patricia", "Manuel", "Elena",
    "Roberto", "Laura", "Diego", "Valeria", "Ricardo", "Natalia", "Alberto", "Daniela", "Fernando", "Paula",
    "Santiago", "Clara", "Eduardo", "Sara", "Alejandro", "Lucia", "Pablo", "Marta", "Jorge", "Beatriz"];
  const lastNames = ["Garcia", "Rodriguez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Cruz", "Flores",
    "Torres", "Rivera", "Morales", "Reyes", "Jimenez", "Mendoza", "Castillo", "Vargas", "Diaz", "Hernandez",
    "Gutierrez", "Silva", "Molina", "Alvarez", "Ortiz", "Gomez", "Guerrero", "Santos", "Cortez", "Luna"];
  const middleNamesPool = [
    "",
    "",
    "Maria",
    "Anne",
    "Santos",
    "Reyes",
    "Isabella",
    "Rodrigo",
    "Lourdes",
    "Francisco",
  ];
  const programs = ["BSCS", "BSIT", "BSCS", "BSIT"]; // 50/50 split
  const yearLevels = ["1", "2", "3", "4"];

  const idx = sequenceIndex - MOCK_COUNT;
  const firstName = firstNames[idx % firstNames.length];
  const lastName = lastNames[Math.floor(idx / firstNames.length) % lastNames.length];
  const middleName = middleNamesPool[idx % middleNamesPool.length];
  const program = programs[idx % programs.length];
  const yearLevel = yearLevels[idx % yearLevels.length];
  const letterVariant = Math.floor(idx / yearLevels.length);
  const section = `${program === "BSCS" ? "CS" : "IT"}${yearLevel}${["A", "B", "C"][letterVariant % 3]}`;
  const statuses = ["Enrolled", "Enrolled", "Enrolled", "On Leave", "Graduating"]; // Most are enrolled
  const scholarships = ["None", "None", "None", "None", "Dean's Lister", "Academic Scholar", "CHED Scholar", "Full Scholar"];
  const skills = [
    ["Programming", "Web Development"], ["UI/UX Design", "Graphic Arts"], ["Data Analysis", "Communication"],
    ["Leadership", "Problem Solving"], ["Database Management", "Programming"], ["Mobile Development", "Web Design"],
    ["Machine Learning", "Python"], ["Network Security", "System Administration"], ["Project Management", "Agile"],
    ["Creative Writing", "Content Creation"], ["Digital Marketing", "Social Media"], ["Game Development", "3D Modeling"],
    ["Cloud Computing", "DevOps"], ["Blockchain", "Cryptocurrency"], ["IoT", "Embedded Systems"],
  ];

  const status = statuses[idx % statuses.length];
  const scholarship = scholarships[idx % scholarships.length];
  const selectedSkills = skills[idx % skills.length];

  return {
    id: String(SEED_ID_FIRST + sequenceIndex),
    firstName,
    middleName,
    lastName,
    gender: idx % 2 === 0 ? "Male" : "Female",
    dob: `${2000 + (idx % 8)}-${String((idx % 12) + 1).padStart(2, "0")}-${String((idx % 28) + 1).padStart(2, "0")}`,
    program,
    yearLevel,
    section,
    status,
    scholarship,
    email: `${firstName.toLowerCase().replace(/\s+/g, "")}.${lastName.toLowerCase()}${idx}@ccs.edu`,
    contact: `0917555${String(10000 + idx).slice(1)}`,
    dateEnrolled: `${2020 + (idx % 5)}-08-${String(15 + (idx % 15)).padStart(2, "0")}`,
    guardian: `${idx % 2 === 0 ? "Maria" : "Jose"} ${lastName}`,
    guardianContact: `0917555${String(20000 + idx).slice(1)}`,
    violation: idx % 10 === 0 ? "Warning (late)" : idx % 25 === 0 ? "Academic probation" : "None",
    skills: selectedSkills,
  };
}

const SEED_STUDENT_COUNT = 1000;

const SEEDED_STUDENTS = [
  ...assignSequentialIds(MOCK_STUDENTS),
  ...Array.from({ length: SEED_STUDENT_COUNT - MOCK_COUNT }, (_, i) =>
    generateRandomStudent(MOCK_COUNT + i),
  ),
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Database connected");

  const clearResult = await Student.deleteMany({
    id: { $regex: /^2201/ },
  });
  console.log(`Cleared ${clearResult.deletedCount} existing seeded students.`);

  await Student.bulkWrite(
    SEEDED_STUDENTS.map((student) => ({
      updateOne: {
        filter: { id: student.id },
        update: { $set: student },
        upsert: true,
      },
    })),
  );
  console.log(`Seeded ${SEEDED_STUDENTS.length} students (${MOCK_COUNT} fixed profiles + ${SEED_STUDENT_COUNT - MOCK_COUNT} generated).`);

  const byProgram = await Student.aggregate([
    { $match: { id: { $regex: /^2201\d{3}$/ } } },
    { $group: { _id: "$program", count: { $sum: 1 } } },
  ]);
  console.log("\nStudents by program (2201xxx IDs):");
  byProgram.forEach((s) => {
    console.log(`  ${s._id}: ${s.count}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
