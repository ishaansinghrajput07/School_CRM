// createAdmin.js — run once to bootstrap the first admin account
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User"); // adjust path if your models folder differs

dotenv.config();

// 🔧 EDIT THESE before running
const ADMIN_NAME = "School Admin";
const ADMIN_EMAIL = "admin@stthomasconvent.edu.in";
const ADMIN_PASSWORD = "ChangeMe1234!"; // change this to something secure

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`A user with email ${ADMIN_EMAIL} already exists (role: ${existing.role}).`);
      process.exit(0);
    }

    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // the model's pre('save') hook hashes this automatically
      role: "admin",
      designation: "principal",
    });

    console.log("✅ Admin account created successfully:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("   Log in at your site's /login page, then change this password immediately.");

    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
  }
}

createAdmin();