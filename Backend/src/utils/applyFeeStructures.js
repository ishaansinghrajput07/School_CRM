const FeeStructure = require("../models/FeeStructure");
const Fee = require("../models/Fee");
const Student = require("../models/Student");

const isSampleStructure = (structure) =>
  /\(SAMPLE\)$/i.test(structure.feeType) || /^SAMPLE\b/i.test(structure.academicYear || "");

/**
 * Creates one Fee record per FeeStructure defined for a class, for the given
 * student. Called whenever a student lands in a class - on signup, on manual
 * admin creation, and on promotion to the next class.
 *
 * Skips a structure if the student already has a Fee with the same feeType +
 * dueDate, so re-running this (e.g. re-promoting by mistake) doesn't create
 * duplicate charges.
 */
async function applyFeeStructuresToStudent(studentId, classId) {
  if (!classId) return [];

  const structures = (await FeeStructure.find({ class: classId })).filter((structure) => !isSampleStructure(structure));
  if (!structures.length) return [];

  const created = [];
  for (const s of structures) {
    const exists = await Fee.findOne({ student: studentId, feeType: s.feeType, dueDate: s.dueDate });
    if (exists) continue;
    const fee = await Fee.create({
      student: studentId,
      feeType: s.feeType,
      amount: s.amount,
      dueDate: s.dueDate,
    });
    created.push(fee);
  }
  return created;
}

/**
 * The inverse of applyFeeStructuresToStudent: when a NEW fee structure is
 * defined for a class, back-apply it to every student already sitting in
 * that class right now (not just future signups/promotions into it).
 */
async function applyNewStructureToExistingStudents(structure) {
  if (isSampleStructure(structure)) return [];

  const students = await Student.find({ class: structure.class }, "_id");
  const created = [];
  for (const s of students) {
    const exists = await Fee.findOne({ student: s._id, feeType: structure.feeType, dueDate: structure.dueDate });
    if (exists) continue;
    const fee = await Fee.create({
      student: s._id,
      feeType: structure.feeType,
      amount: structure.amount,
      dueDate: structure.dueDate,
    });
    created.push(fee);
  }
  return created;
}

module.exports = { applyFeeStructuresToStudent, applyNewStructureToExistingStudents };
