function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: "Too short", color: "bg-red-400", text: "text-red-500" },
  { label: "Weak", color: "bg-red-400", text: "text-red-500" },
  { label: "Fair", color: "bg-[#A88B5B]", text: "text-[#A88B5B]" },
  { label: "Good", color: "bg-[#6B9B72]", text: "text-[#4F7C5A]" },
  { label: "Strong", color: "bg-[#4F7C5A]", text: "text-[#4F7C5A]" },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? level.color : "bg-[#E7E2D8]"}`} />
        ))}
      </div>
      <p className={`mt-1.5 text-xs font-medium ${level.text}`}>{level.label}</p>
    </div>
  );
}
