/**
 * One-time seed: inserts mock students matching the frontend mock data.
 * Run: npm run seed (from backend directory, with .env and MongoDB available).
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");
const SEED_ID_PREFIX = "2201";
const SEED_ID_START = 1;

const MOCK_STUDENTS = [
  {
    id: "2201001",
    firstName: "Jan Earl",
    middleName: "Eclarinal",
    lastName: "Olivar",
    gender: "Male",
    dob: "2004-05-15",
    program: "BSCS",
    yearLevel: "3",
    section: "CS3A",
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
    id: "2201002",
    firstName: "Eden",
    middleName: "Santos",
    lastName: "Nataya",
    gender: "Female",
    dob: "2005-09-20",
    program: "BSIT",
    yearLevel: "2",
    section: "IT2B",
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
    id: "2201903",
    firstName: "Claire",
    middleName: "D.",
    lastName: "Valdez",
    gender: "Female",
    dob: "2005-07-12",
    program: "BSCS",
    yearLevel: "1",
    section: "CS1C",
    status: "Enrolled",
    scholarship: "None",
    email: "claire.valdez@ccs.edu",
    contact: "09175551003",
    dateEnrolled: "2024-08-23",
    guardian: "Diana Valdez",
    guardianContact: "09175558833",
    violation: "None",
    skills: ["Programming", "UI/UX Design"],
  },
  {
    id: "2201904",
    firstName: "Dylan",
    middleName: "R.",
    lastName: "Lopez",
    gender: "Male",
    dob: "2003-03-30",
    program: "BSIT",
    yearLevel: "4",
    section: "IT4A",
    status: "On Leave",
    scholarship: "Athletic Grant",
    email: "dylan.lopez@ccs.edu",
    contact: "09175551004",
    dateEnrolled: "2021-08-20",
    guardian: "Rosa Lopez",
    guardianContact: "09175554411",
    violation: "None",
    skills: ["Leadership", "Communication", "Problem Solving"],
  },
  {
    id: "2201905",
    firstName: "Elaine",
    middleName: "C.",
    lastName: "Tan",
    gender: "Female",
    dob: "2004-01-15",
    program: "BSIT",
    yearLevel: "3",
    section: "IT3A",
    status: "Enrolled",
    scholarship: "CHED Scholar",
    email: "elaine.tan@ccs.edu",
    contact: "09175551005",
    dateEnrolled: "2022-08-22",
    guardian: "Carlos Tan",
    guardianContact: "09175552288",
    violation: "Warning (late)",
    skills: ["Web Development", "Database Management", "Programming"],
  },
  {
    id: "2201906",
    firstName: "Franco",
    middleName: "N.",
    lastName: "Garcia",
    gender: "Male",
    dob: "2003-09-08",
    program: "BSCS",
    yearLevel: "4",
    section: "CS4B",
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
    id: "2201907",
    firstName: "Giselle",
    middleName: "P.",
    lastName: "Chua",
    gender: "Female",
    dob: "2005-04-27",
    program: "BSCS",
    yearLevel: "2",
    section: "CS2B",
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
    id: "2201908",
    firstName: "Hans",
    middleName: "E.",
    lastName: "Uy",
    gender: "Male",
    dob: "2004-06-02",
    program: "BSIT",
    yearLevel: "3",
    section: "IT3C",
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
    id: "2201909",
    firstName: "Isabel",
    middleName: "V.",
    lastName: "Cruz",
    gender: "Female",
    dob: "2005-12-10",
    program: "BSIT",
    yearLevel: "2",
    section: "IT2B",
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
    id: "2201910",
    firstName: "Javier",
    middleName: "S.",
    lastName: "Delos Reyes",
    gender: "Male",
    dob: "2003-10-19",
    program: "BSCS",
    yearLevel: "4",
    section: "CS4B",
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
    id: "2201911",
    firstName: "Katrina",
    middleName: "A.",
    lastName: "Mendoza",
    gender: "Female",
    dob: "2006-03-22",
    program: "BSIT",
    yearLevel: "1",
    section: "IT1B",
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
    id: "2201912",
    firstName: "Miguel",
    middleName: "T.",
    lastName: "Santos",
    gender: "Male",
    dob: "2004-08-14",
    program: "BSCS",
    yearLevel: "3",
    section: "CS3A",
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
    id: "2201913",
    firstName: "Nicole",
    middleName: "B.",
    lastName: "Torres",
    gender: "Female",
    dob: "2005-05-30",
    program: "BSIT",
    yearLevel: "2",
    section: "IT2C",
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
    id: "2201914",
    firstName: "Oscar",
    middleName: "D.",
    lastName: "Ramos",
    gender: "Male",
    dob: "2003-12-05",
    program: "BSCS",
    yearLevel: "4",
    section: "CS4A",
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
    id: "2201915",
    firstName: "Patricia",
    middleName: "C.",
    lastName: "Gonzales",
    gender: "Female",
    dob: "2006-01-18",
    program: "BSIT",
    yearLevel: "1",
    section: "IT1A",
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

// Helper function to generate random student data
function generateRandomStudent(index) {
  const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Sofia", "Miguel", "Isabella", "Carlos", "Gabriela", 
                      "Antonio", "Carmen", "Francisco", "Rosa", "Luis", "Teresa", "Javier", "Patricia", "Manuel", "Elena",
                      "Roberto", "Laura", "Diego", "Valeria", "Ricardo", "Natalia", "Alberto", "Daniela", "Fernando", "Paula",
                      "Santiago", "Clara", "Eduardo", "Sara", "Alejandro", "Lucia", "Pablo", "Marta", "Jorge", "Beatriz"];
  const lastNames = ["Garcia", "Rodriguez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Cruz", "Flores",
                     "Torres", "Rivera", "Morales", "Reyes", "Jimenez", "Mendoza", "Castillo", "Vargas", "Diaz", "Hernandez",
                     "Gutierrez", "Silva", "Molina", "Alvarez", "Ortiz", "Gomez", "Guerrero", "Santos", "Cortez", "Luna"];
  const middleInitials = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "N.", "O.", "P.", "Q.", "R.", "S.", "T."];
  const programs = ["BSCS", "BSIT", "BSCS", "BSIT"]; // 50/50 split
  const yearLevels = ["1", "2", "3", "4"];
  const sections = {
    "BSCS": ["CS1A", "CS1B", "CS1C", "CS2A", "CS2B", "CS2C", "CS3A", "CS3B", "CS3C", "CS4A", "CS4B", "CS4C"],
    "BSIT": ["IT1A", "IT1B", "IT1C", "IT2A", "IT2B", "IT2C", "IT3A", "IT3B", "IT3C", "IT4A", "IT4B", "IT4C"]
  };
  const statuses = ["Enrolled", "Enrolled", "Enrolled", "On Leave", "Graduating"]; // Most are enrolled
  const scholarships = ["None", "None", "None", "None", "Dean's Lister", "Academic Scholar", "CHED Scholar", "Full Scholar"];
  const skills = [
    ["Programming", "Web Development"], ["UI/UX Design", "Graphic Arts"], ["Data Analysis", "Communication"],
    ["Leadership", "Problem Solving"], ["Database Management", "Programming"], ["Mobile Development", "Web Design"],
    ["Machine Learning", "Python"], ["Network Security", "System Administration"], ["Project Management", "Agile"],
    ["Creative Writing", "Content Creation"], ["Digital Marketing", "Social Media"], ["Game Development", "3D Modeling"],
    ["Cloud Computing", "DevOps"], ["Blockchain", "Cryptocurrency"], ["IoT", "Embedded Systems"]
  ];

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const middleName = middleInitials[index % middleInitials.length];
  const program = programs[index % programs.length];
  const yearLevel = yearLevels[index % yearLevels.length];
  const section = sections[program][Math.floor(index / 4) % sections[program].length];
  const status = statuses[index % statuses.length];
  const scholarship = scholarships[index % scholarships.length];
  const selectedSkills = skills[index % skills.length];

  return {
    id: `${SEED_ID_PREFIX}${String(SEED_ID_START + index).padStart(3, "0")}`,
    firstName: firstName,
    middleName: middleName,
    lastName: lastName,
    gender: index % 2 === 0 ? "Male" : "Female",
    dob: `${2000 + (index % 8)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
    program: program,
    yearLevel: yearLevel,
    section: section,
    status: status,
    scholarship: scholarship,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@ccs.edu`,
    contact: `0917555${String(10000 + index).slice(1)}`,
    dateEnrolled: `${2020 + (index % 5)}-08-${String(15 + (index % 15)).padStart(2, "0")}`,
    guardian: `${index % 2 === 0 ? "Maria" : "Jose"} ${lastName}`,
    guardianContact: `0917555${String(20000 + index).slice(1)}`,
    violation: index % 10 === 0 ? "Warning (late)" : index % 25 === 0 ? "Academic probation" : "None",
    skills: selectedSkills,
  };
}

// Generate 1,000 students
const SEEDED_STUDENTS = Array.from({ length: SEED_STUDENT_COUNT }, (_, index) => generateRandomStudent(index));

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Database connected");

  // Clear existing seeded students (IDs 2201901-2201999)
  const clearResult = await Student.deleteMany({
    id: { $regex: /^2201/ },
  });
  console.log(`Cleared ${clearResult.deletedCount} existing seeded students.`);

  // Insert fresh seeded students
  await Student.bulkWrite(
    SEEDED_STUDENTS.map((student) => ({
      updateOne: {
        filter: { id: student.id },
        update: { $set: student },
        upsert: true,
      },
    })),
  );
  console.log(`Seeded ${SEEDED_STUDENTS.length} students.`);

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
