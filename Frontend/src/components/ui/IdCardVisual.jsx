import { GraduationCap, IdCard as IdCardIcon, FileText, Phone, Mail, MapPin, ShieldAlert } from "lucide-react";

// Full student profile, styled as photo panel + information tables.
// Used by both the admin (viewing any student) and the student (own profile).
export default function IdCardVisual({ student }) {
  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName || ""}`.trim();
  const dob = student.dob ? new Date(student.dob).toLocaleDateString() : "—";
  const admissionDate = student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : "—";
  const validTill = student.idCard?.validTill ? new Date(student.idCard.validTill).toLocaleDateString() : "—";

  const generalInfo = [
    ["Roll No.", student.rollNumber || "—"],
    ["Academic Year", student.academicYear || "—"],
    ["Gender", student.gender ? student.gender[0].toUpperCase() + student.gender.slice(1) : "—"],
    ["Date of Birth", dob],
    ["Blood Group", student.bloodGroup || "—"],
    ["Branch", student.branch || "—"],
    ["Semester", student.semester || "—"],
    ["Status", student.status ? student.status[0].toUpperCase() + student.status.slice(1) : "—"],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* School masthead - printed on every ID card / profile view */}
      <div className="mb-4 flex items-center gap-3 border-b border-navy-100 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-navy-500 to-violet-600 text-white shadow-sm">
          <GraduationCap size={22} />
        </div>
        <div>
          <p className="font-display text-lg font-bold text-navy-900">St. Thomas Convent Hr. Sec. School</p>
          <p className="text-xs text-navy-400">Student Identity Card & Profile</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] print:grid-cols-[280px_1fr]">
      {/* Photo + identity panel */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700 via-navy-600 to-teal-600 p-6 text-center text-white shadow-card">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/10 text-4xl font-bold">
          {student.photo ? (
            <img src={student.photo} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <span>{student.firstName?.[0]}{student.lastName?.[0] || ""}</span>
          )}
        </div>
        <p className="mt-4 font-display text-lg font-bold">{fullName}</p>
        <p className="text-sm text-white/70">{student.class?.name || "—"} {student.section && `· Section ${student.section}`}</p>
        {student.class?.classTeacher?.name && (
          <p className="text-xs text-white/60">Class Teacher: {student.class.classTeacher.name}</p>
        )}

        <div className="mt-5 space-y-2 rounded-xl bg-white/10 p-3 text-left text-xs">
          <div className="flex items-center gap-2">
            <IdCardIcon size={13} className="shrink-0 text-white/60" />
            <span className="text-white/60">Student ID:</span> <span className="font-mono">{student.admissionNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap size={13} className="shrink-0 text-white/60" />
            <span className="text-white/60">Card No:</span> <span className="font-mono">{student.idCard?.cardNumber || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={13} className="shrink-0 text-white/60" />
            <span className="text-white/60">Phone:</span> {student.phone || "—"}
          </div>
        </div>
        <p className="mt-3 text-[10px] text-white/50">Valid till {validTill}</p>
      </div>

      {/* Information panels */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-navy-900">
            <IdCardIcon size={16} className="text-teal-600" /> General Information
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {generalInfo.map(([label, value]) => (
                <tr key={label} className="border-b border-navy-50 last:border-0">
                  <td className="py-2 pr-4 text-navy-400">{label}</td>
                  <td className="py-2 text-navy-400">:</td>
                  <td className="py-2 pl-4 font-medium text-navy-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-navy-900">
            <FileText size={16} className="text-violet-600" /> Other Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-navy-300" />
              <div>
                <p className="text-xs text-navy-400">Address</p>
                <p className="font-medium text-navy-800">{student.address || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={14} className="mt-0.5 shrink-0 text-navy-300" />
              <div>
                <p className="text-xs text-navy-400">Admission Date</p>
                <p className="font-medium text-navy-800">{admissionDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={14} className="mt-0.5 shrink-0 text-navy-300" />
              <div>
                <p className="text-xs text-navy-400">Subjects</p>
                <p className="font-medium text-navy-800">{student.subjects?.length ? student.subjects.join(", ") : "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={14} className="mt-0.5 shrink-0 text-navy-300" />
              <div>
                <p className="text-xs text-navy-400">Passing Year</p>
                <p className="font-medium text-navy-800">{student.passingYear || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-navy-900">
            <Phone size={16} className="text-amber-600" /> Parent / Guardian & Emergency Contact
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <Info label="Father's Name" value={student.parent?.fatherName} />
            <Info label="Mother's Name" value={student.parent?.motherName} />
            <Info icon={Phone} label="Parent Phone" value={student.parent?.phone} />
            <Info icon={Mail} label="Parent Email" value={student.parent?.email} />
            <Info icon={ShieldAlert} label="Emergency Contact" value={student.emergencyContact?.name} />
            <Info icon={Phone} label="Emergency Phone" value={student.emergencyContact?.phone} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={14} className="mt-0.5 shrink-0 text-navy-300" />}
      <div>
        <p className="text-xs text-navy-400">{label}</p>
        <p className="font-medium text-navy-800">{value || "—"}</p>
      </div>
    </div>
  );
}
