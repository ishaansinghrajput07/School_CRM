// Run with: npm run sync-indexes
//
// With autoIndex disabled in production (see src/config/db.js), indexes are
// no longer built automatically on every boot. Run this once after deploying
// this change, and again any time a model's indexes change afterward -
// mongoose.syncIndexes() creates whatever's missing and drops whatever's no
// longer defined in the schema, bringing the live database in line with
// the current model definitions. Safe to re-run; it's a no-op if nothing
// changed since the last run.
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

dotenv.config();

// Every model that defines an index needs to be required here so mongoose
// knows about its schema before syncIndexes() runs.
const models = [
  "User",
  "Student",
  "Class",
  "Subject",
  "Attendance",
  "Mark",
  "Fee",
  "FeeStructure",
  "Invoice",
  "Salary",
  "Transaction",
  "Notice",
  "Ticket",
  "TrackingRequest",
  "Exam",
  "Assignment",
  "Project",
  "ExternalResult",
  "Gallery",
  "Syllabus",
  "Topper",
  "Feedback",
  "Event",
  "EventRegistration",
  "AdmissionApplication",
  "Otp",
  "Notification",
  "Settings",
];

(async () => {
  await connectDB();

  for (const name of models) {
    try {
      const model = require(`../models/${name}`);
      const result = await model.syncIndexes();
      console.log(`✓ ${name}: ${result.length ? result.join(", ") : "already in sync"}`);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  console.log("\nDone.");
  await mongoose.connection.close();
  process.exit(0);
})();
