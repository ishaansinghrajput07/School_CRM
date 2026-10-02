// Run with: npm run seed
// Creates the Nursery -> Grade 12 class structure, sample public website
// content (only when each collection is empty), and ONE admin login (only
// if no admin exists yet).
//
// IMPORTANT: this does NOT wipe existing data anymore. Earlier versions
// deleted every user/student/class on every run, which is almost certainly
// why "seed doesn't work when I switch to Atlas" happened: re-running it
// against a database that already had real signups/admins silently erased
// them, or - if MONGO_URI pointed somewhere unexpected - it looked like it
// "did nothing" because it succeeded against the wrong database. Use
// `npm run seed:reset` (with RESET=true) if you deliberately want a clean
// slate in a dev/test database.
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const FeeStructure = require("../models/FeeStructure");
const Gallery = require("../models/Gallery");
const Syllabus = require("../models/Syllabus");
const Notice = require("../models/Notice");
const Event = require("../models/Event");
const Settings = require("../models/Settings");

dotenv.config();

// Standard K-12 progression: Nursery, LKG, UKG, then Grade 1 through Grade 12
const CLASS_LEVELS = [
  "Nursery",
  "LKG",
  "UKG",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
];

// Four sections per class by default (A-D) - admin can add/rename sections
// per class later from Admin -> Academics.
const DEFAULT_SECTIONS = ["A", "B", "C", "D"];

const getAcademicYear = (date = new Date()) => {
  const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

const seedPublicContent = async (classes) => {
  const academicYear = getAcademicYear();
  const sampleAcademicYear = `SAMPLE ${academicYear} - replace before publication`;

  if ((await Settings.countDocuments()) === 0) {
    await Settings.create({ key: "school" });
    console.log("Created default school settings.");
  }

  if ((await FeeStructure.countDocuments()) === 0 && classes.length > 0) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const feeStructures = classes.flatMap((classDoc, index) => {
      const tuition = index < 3 ? 9000 : index < 8 ? 11000 : 14000;
      const transport = 3000;
      const activities = 750;
      const classFees = [];

      for (const semester of [1, 2]) {
        for (const [feeType, amount] of [
          ["Tuition (SAMPLE)", tuition],
          ["Transport (SAMPLE)", transport],
          ["Activities (SAMPLE)", activities],
        ]) {
          classFees.push({
            class: classDoc._id,
            feeType,
            amount,
            semester,
            dueDate,
            academicYear: sampleAcademicYear,
          });
        }
      }

      classFees.push({
        class: classDoc._id,
        feeType: "Admission (SAMPLE)",
        amount: 2500,
        dueDate,
        academicYear: sampleAcademicYear,
      });
      return classFees;
    });

    await FeeStructure.insertMany(feeStructures);
    console.log(`Created ${feeStructures.length} clearly marked sample fee records.`);
  }

  if ((await Syllabus.countDocuments()) === 0 && classes.length > 0) {
    const syllabusDocs = classes.flatMap((classDoc, index) => {
      const subjects =
        index < 3
          ? [
              { name: "Language and Communication", topics: ["Listening and speaking", "Stories and vocabulary"] },
              { name: "Early Numeracy", topics: ["Counting", "Shapes and patterns"] },
              { name: "Creative and Physical Development", topics: ["Art and music", "Movement and play"] },
            ]
          : index < 8
            ? [
                { name: "English (SAMPLE)", topics: ["Reading comprehension", "Writing and vocabulary"] },
                { name: "Mathematics (SAMPLE)", topics: ["Number operations", "Measurement and geometry"] },
                { name: "Environmental Studies (SAMPLE)", topics: ["Living things", "Our community"] },
                { name: "Hindi (SAMPLE)", topics: ["Reading practice", "Language and composition"] },
              ]
            : [
                { name: "English (SAMPLE)", topics: ["Reading and interpretation", "Writing and grammar"] },
                { name: "Mathematics (SAMPLE)", topics: ["Number systems", "Algebra and geometry"] },
                { name: "Science (SAMPLE)", topics: ["Scientific observation", "Core concepts and applications"] },
                { name: "Social Science (SAMPLE)", topics: ["History and civics", "Geography and society"] },
              ];

      return [1, 2].map((semester) => ({
        class: classDoc._id,
        semester,
        academicYear: sampleAcademicYear,
        subjects,
        notes: "SAMPLE DATA - illustrative topics only; replace with the school's approved syllabus.",
      }));
    });

    await Syllabus.insertMany(syllabusDocs);
    console.log(`Created ${syllabusDocs.length} clearly marked sample syllabus records.`);
  }

  const sampleGallery = [
    { title: "SAMPLE: Campus", category: "campus", imageUrl: "/demo-gallery/campus.webp", caption: "Illustrative sample image - replace with an actual school photo.", featured: true },
    { title: "SAMPLE: Computer Lab", category: "academics", imageUrl: "/demo-gallery/computer-lab.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: Science Lab", category: "academics", imageUrl: "/demo-gallery/science-lab.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: Classroom", category: "activities", imageUrl: "/demo-gallery/classroom.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: Library", category: "campus", imageUrl: "/demo-gallery/library.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: School Activity", category: "activities", imageUrl: "/demo-gallery/activities.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: Sports Day", category: "sports", imageUrl: "/demo-gallery/sports.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: Cultural Program", category: "cultural", imageUrl: "/demo-gallery/cultural.webp", caption: "Illustrative sample image - replace with an actual school photo." },
    { title: "SAMPLE: School Event", category: "events", imageUrl: "/demo-gallery/event.webp", caption: "Illustrative sample image - replace with an actual school photo." },
  ].map((photo, order) => ({ ...photo, order, isActive: true }));

  if ((await Gallery.countDocuments()) === 0) {
    await Gallery.insertMany(sampleGallery);
    console.log(`Created ${sampleGallery.length} sample gallery records.`);
  }

  if ((await Notice.countDocuments()) === 0) {
    const noticeDate = new Date();
    noticeDate.setDate(noticeDate.getDate() + 14);
    const expiresAt = new Date(noticeDate);
    expiresAt.setDate(expiresAt.getDate() + 30);
    await Notice.insertMany([
      {
        title: "SAMPLE: Admissions enquiry information",
        content: "This sample notice demonstrates the public notice board. Replace it with current, school-approved admission information.",
        category: "general",
        eventDate: noticeDate,
        expiresAt,
        isActive: true,
      },
      {
        title: "SAMPLE: Academic calendar update",
        content: "This sample notice is for display testing only. Publish confirmed dates through the admin portal before sharing with families.",
        category: "event",
        eventDate: new Date(noticeDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        expiresAt,
        isActive: true,
      },
    ]);
    console.log("Created sample public notices.");
  }

  if ((await Event.countDocuments()) === 0) {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 21);
    eventDate.setHours(9, 0, 0, 0);
    const nextEventDate = new Date(eventDate);
    nextEventDate.setDate(nextEventDate.getDate() + 28);
    await Event.insertMany([
      {
        title: "SAMPLE: Science Exhibition",
        description: "Sample event for layout testing. Replace with a confirmed school event before publication.",
        category: "academic",
        date: eventDate,
        startTime: "09:00 AM",
        endTime: "01:00 PM",
        location: "School campus (sample)",
        audience: "all",
        isActive: true,
      },
      {
        title: "SAMPLE: Sports Day",
        description: "Sample event for layout testing. Replace with a confirmed school event before publication.",
        category: "sports",
        date: nextEventDate,
        startTime: "08:30 AM",
        endTime: "12:30 PM",
        location: "School grounds (sample)",
        audience: "all",
        isActive: true,
      },
    ]);
    console.log("Created sample upcoming events.");
  }

  console.log("No sample testimonials or toppers were created; add only approved feedback and verified student achievements.");
};

const run = async () => {
  await connectDB();
  console.log(`Connected. Seeding into database: "${mongoose.connection.name}"`);

  if (process.env.RESET === "true") {
    console.log("RESET=true - clearing users, students, classes, and marked sample website content...");
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({}),
      FeeStructure.deleteMany({ feeType: /\(SAMPLE\)$/ }),
      Gallery.deleteMany({ title: /^SAMPLE:/ }),
      Syllabus.deleteMany({ notes: /^SAMPLE DATA/ }),
      Notice.deleteMany({ title: /^SAMPLE:/ }),
      Event.deleteMany({ title: /^SAMPLE:/ }),
    ]);
  }

  const existingClassCount = await Class.countDocuments();
  if (existingClassCount === 0) {
    console.log("Creating classes: Nursery through Grade 12 (sections A-D each)...");
    // Grade 8 and above: students self-report their own results.
    // Below Grade 8 (Nursery..Grade 7): only a teacher/admin can enter results.
    const grade8Index = CLASS_LEVELS.indexOf("Grade 8");
    await Class.insertMany(
      CLASS_LEVELS.map((name, index) => ({
        name,
        order: index,
        sections: DEFAULT_SECTIONS,
        semesterCount: 2,
        allowSelfResultEntry: index >= grade8Index,
      }))
    );
  } else {
    console.log(`Skipping class creation - ${existingClassCount} classes already exist.`);
  }

  await seedPublicContent(await Class.find().sort({ order: 1 }));

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log(`Skipping admin creation - an admin already exists: ${existingAdmin.email}`);
  } else {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error(
        "No admin exists yet, and ADMIN_EMAIL / ADMIN_PASSWORD are not set in your .env - " +
          "set both and re-run `npm run seed` to create the first admin login."
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    const existingUserWithEmail = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (existingUserWithEmail) {
      console.error(
        `A user with email ${process.env.ADMIN_EMAIL} already exists with role "${existingUserWithEmail.role}". ` +
          "Choose a different ADMIN_EMAIL, or fix that account's role directly in the database."
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    await User.create({
      name: process.env.ADMIN_NAME || "Administrator",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      designation: "principal",
      dateOfJoining: new Date(),
    });
    console.log(`Admin created: ${process.env.ADMIN_EMAIL}`);
  }

  console.log("Seed complete. Replace all clearly marked SAMPLE website content with school-approved data before launch.");
  console.log("Log in as admin, then create teachers/staff, link parents, and let students self-register at /signup.");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
