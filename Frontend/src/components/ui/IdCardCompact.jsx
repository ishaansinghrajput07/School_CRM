import { GraduationCap, Phone, MapPin } from "lucide-react";

// Short, wallet/print-card sized ID card - the physical-card equivalent of
// IdCardVisual (which is the full profile view). Deliberately only carries
// the fields that belong on a real ID card: photo, name, class & section,
// academic year, address and mobile number.
export default function IdCardCompact({ student, schoolName = "St. Thomas Convent Hr. Sec. School" }) {
  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName || ""}`.trim();
  const validTill = student.idCard?.validTill ? new Date(student.idCard.validTill).toLocaleDateString() : "—";

  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card print:shadow-none">
      {/* Masthead */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-navy-700 to-teal-600 px-4 py-3 text-white">
        <GraduationCap size={20} />
        <div className="min-w-0">
          <p className="truncate font-display text-xs font-bold leading-tight">{schoolName}</p>
          <p className="text-[10px] text-white/70">Student Identity Card</p>
        </div>
      </div>

      <div className="flex gap-4 p-4">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-navy-100 bg-navy-50">
          {student.photo ? (
            <img src={student.photo} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-navy-300">
              {student.firstName?.[0]}
              {student.lastName?.[0] || ""}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate font-display text-sm font-bold text-navy-900">{fullName}</p>
          <p className="text-xs text-navy-500">
            {student.class?.name || "—"}
            {student.section && ` · Section ${student.section}`}
          </p>
          <p className="text-xs text-navy-400">Academic Year: {student.academicYear || "—"}</p>
          <p className="font-mono text-[11px] text-navy-400">{student.admissionNumber}</p>

          <div className="flex items-start gap-1.5 pt-1 text-[11px] text-navy-500">
            <Phone size={11} className="mt-0.5 shrink-0 text-navy-300" />
            <span>{student.phone || student.parent?.phone || "—"}</span>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-navy-500">
            <MapPin size={11} className="mt-0.5 shrink-0 text-navy-300" />
            <span className="line-clamp-2">{student.address || "—"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-navy-100 bg-navy-50/60 px-4 py-2 text-[10px] text-navy-400">
        <span>Card No: {student.idCard?.cardNumber || "—"}</span>
        <span>Valid till {validTill}</span>
      </div>
    </div>
  );
}
