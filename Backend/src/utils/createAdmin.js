// Run with: npm run create-admin
// Creates (or resets the password of) ONE admin login from ADMIN_NAME /
// ADMIN_EMAIL / ADMIN_PASSWORD in your .env - nothing else. Unlike
// `npm run seed`, this never touches classes/students and, importantly,
// WILL update the password of an existing account with that email instead
// of skipping it - useful if you seeded once, forgot the password, and just
// want back in without wiping/recreating everything.
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const run = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first, then re-run this.");
    process.exit(1);
  }

  await connectDB();
  console.log(`Connected to database: "${mongoose.connection.name}"`);

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  let user = await User.findOne({ email }).select("+password");

  if (user) {
    if (user.role !== "admin") {
      console.error(
        `A user with email ${email} already exists with role "${user.role}", not "admin". ` +
          "Refusing to overwrite it - use a different ADMIN_EMAIL, or fix this account's role deliberately."
      );
      await mongoose.connection.close();
      process.exit(1);
    }
    user.name = process.env.ADMIN_NAME || user.name;
    user.password = process.env.ADMIN_PASSWORD; // re-hashed automatically by the pre-save hook
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.isActive = true;
    await user.save();
    console.log(`Existing admin updated: ${email} (password reset to the value in .env)`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Administrator",
      email,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      designation: "principal",
      dateOfJoining: new Date(),
    });
    console.log(`Admin created: ${email}`);
  }

  console.log("You can log in now with the email/password from your .env.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
