import { GraduationCap } from "lucide-react";

// Deadline is a plain constant, not fetched - update this one line each
// admission cycle. Kept separate from Settings/backend since it changes
// once a year and doesn't need a database round-trip on every homepage load.
const ADMISSION_DEADLINE = "31st March 2027";

const MESSAGE = `Admissions open for 2026-27 — apply before ${ADMISSION_DEADLINE} · Limited seats across Nursery to Class XII · Scholarships available for meritorious students`;

export default function AdmissionBanner() {
  return (
    <div className="relative z-[60] overflow-hidden bg-gradient-to-r from-amber-500 via-coral-500 to-amber-500 py-2">
      <div className="animate-marquee-reverse flex w-max items-center gap-10 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10 pr-10" aria-hidden={copy === 1}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-bold text-navy-900 sm:text-sm">
                <GraduationCap size={15} />
                {MESSAGE}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}