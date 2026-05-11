import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STUDENTS = [
  { name: "Student One", matricNo: "CSC/ND2/24/001" },
  { name: "Student Two", matricNo: "CSC/ND2/24/002" },
  { name: "Student Three", matricNo: "CSC/ND2/24/003" },
  { name: "Student Four", matricNo: "CSC/ND2/24/004" },
  { name: "Student Five", matricNo: "CSC/ND2/24/005" },
  { name: "Student Six", matricNo: "CSC/ND2/24/006" },
  { name: "Student Seven", matricNo: "CSC/ND2/24/007" },
  { name: "Student Eight", matricNo: "CSC/ND2/24/008" },
  { name: "Student Nine", matricNo: "CSC/ND2/24/009" },
  { name: "Student Ten", matricNo: "CSC/ND2/24/010" },
];

const COURSES = [
  "COM 211: Data Structures and Algorithms",
  "COM 212: Database Management Systems",
  "COM 213: Computer Networks",
  "COM 214: Systems Analysis and Design",
  "COM 215: Object-Oriented Programming",
  "ENT 211: Entrepreneurship Development",
];

const DEFAULT_SECURITY_QUESTION = "What is your mother's maiden name?";
const DEFAULT_SECURITY_ANSWER = "pogil";

async function main() {
  console.log("Seeding POGIL College of Health Technology — CS ND II...");

  const defaultAnswerHash = await bcrypt.hash(DEFAULT_SECURITY_ANSWER, 10);

  const adminPw = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pogil.edu.ng" },
    update: { password: adminPw, securityQuestion: DEFAULT_SECURITY_QUESTION, securityAnswer: defaultAnswerHash },
    create: {
      name: "System Administrator",
      email: "admin@pogil.edu.ng",
      password: adminPw,
      role: "admin",
      securityQuestion: DEFAULT_SECURITY_QUESTION,
      securityAnswer: defaultAnswerHash,
    },
  });
  console.log("Admin:", admin.email);

  const lecturerPw = await bcrypt.hash("lecturer123", 10);
  const lecturer = await prisma.user.upsert({
    where: { email: "akinboro.deborah@pogil.edu.ng" },
    update: {
      password: lecturerPw,
      securityQuestion: DEFAULT_SECURITY_QUESTION,
      securityAnswer: defaultAnswerHash,
    },
    create: {
      name: "Mrs. Akinboro Deborah",
      email: "akinboro.deborah@pogil.edu.ng",
      password: lecturerPw,
      role: "lecturer",
      securityQuestion: DEFAULT_SECURITY_QUESTION,
      securityAnswer: defaultAnswerHash,
    },
  });
  console.log("Lecturer:", lecturer.email);

  const studentPw = await bcrypt.hash("student123", 10);
  for (const s of STUDENTS) {
    await prisma.user.upsert({
      where: { matricNo: s.matricNo },
      update: {
        name: s.name,
        password: studentPw,
        securityQuestion: DEFAULT_SECURITY_QUESTION,
        securityAnswer: defaultAnswerHash,
      },
      create: {
        name: s.name,
        matricNo: s.matricNo,
        password: studentPw,
        role: "student",
        securityQuestion: DEFAULT_SECURITY_QUESTION,
        securityAnswer: defaultAnswerHash,
      },
    });
  }
  console.log(`${STUDENTS.length} students seeded.`);

  for (const course of COURSES) {
    const exists = await prisma.session.findFirst({ where: { course, lecturerId: lecturer.id } });
    if (!exists) {
      const qrCode = `${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await prisma.session.create({ data: { course, qrCode, lecturerId: lecturer.id } });
    }
  }
  console.log(`${COURSES.length} course sessions seeded.`);

  console.log("\n--- Demo Credentials ---");
  console.log("Admin:    admin@pogil.edu.ng / admin123");
  console.log("Lecturer: akinboro.deborah@pogil.edu.ng / lecturer123");
  console.log("Students: CSC/ND2/24/001–010 / student123");
  console.log("Security question answer (demo): pogil");
  console.log("------------------------\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
