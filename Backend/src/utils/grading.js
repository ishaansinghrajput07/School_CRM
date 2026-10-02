// Standard 10-point grading scale used across the Results module.
const SCALE = [
  { min: 90, grade: "O", point: 10 },
  { min: 80, grade: "A+", point: 9 },
  { min: 70, grade: "A", point: 8 },
  { min: 60, grade: "B+", point: 7 },
  { min: 50, grade: "B", point: 6 },
  { min: 40, grade: "C", point: 5 },
  { min: 0, grade: "F", point: 0 },
];

function gradeForPercentage(percentage) {
  const band = SCALE.find((s) => percentage >= s.min);
  return band || SCALE[SCALE.length - 1];
}

module.exports = { gradeForPercentage };
