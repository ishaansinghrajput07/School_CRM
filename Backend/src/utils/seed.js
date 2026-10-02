// Run with: npm run seed
// Creates the Nursery -> Grade 12 class structure (idempotent - safe to
// re-run) and ONE admin login (only if no admin exists yet).
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

const run = async () => {
  await connectDB();
  console.log(`Connected. Seeding into database: "${mongoose.connection.name}"`);

  if (process.env.RESET === "true") {
    console.log("RESET=true - clearing existing users, students, and classes...");
    await Promise.all([User.deleteMany({}), Student.deleteMany({}), Class.deleteMany({})]);
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

  console.log("Seed complete. Log in as admin, then create teachers/staff, link parents, and let students self-register at /signup.");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
