const Class = require("../models/Class");
const Subject = require("../models/Subject");

// Classes a teacher is allowed to access: classes they're the class teacher
// of, plus classes they teach a subject in. Returns a Set of class ID
// strings so callers can do cheap `.has()` checks or spread into a $in query.
const getTeacherClassIds = async (userId) => {
  const [asClassTeacher, subjects] = await Promise.all([
    Class.find({ classTeacher: userId }, "_id"),
    Subject.find({ teacher: userId }, "class"),
  ]);
  const ids = new Set([...asClassTeacher.map((c) => String(c._id)), ...subjects.map((s) => String(s.class))]);
  return ids;
};

module.exports = { getTeacherClassIds };