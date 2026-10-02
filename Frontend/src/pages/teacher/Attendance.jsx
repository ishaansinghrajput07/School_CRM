import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { attendanceApi, studentsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "bg-teal-500" },
  { value: "absent", label: "Absent", color: "bg-red-500" },
  { value: "late", label: "Late", color: "bg-amber-500" },
  { value: "half_day", label: "Half Day", color: "bg-navy-400" },
];

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    attendanceApi.myClasses().then(({ data }) => setClasses(data.classes));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    studentsApi.list({ class: selectedClass, limit: 100 }).then(({ data }) => {
      setStudents(data.students);
      const defaults = {};
      data.students.forEach((s) => (defaults[s._id] = "present"));
      setStatusMap(defaults);
    });
  }, [selectedClass]);

  const setStatus = (studentId, status) => setStatusMap((prev) => ({ ...prev, [studentId]: status }));

  const handleSave = async () => {
    if (!selectedClass) return toast.error("Select a class first");
    setSaving(true);
    try {
      const records = students.map((s) => ({
        student: s._id,
        class: selectedClass,
        status: statusMap[s._id] || "present",
      }));
      await attendanceApi.mark({ records, date });
      toast.success("Attendance saved. Absence alerts sent to parents.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark today's attendance for your own classes" />

      {classes.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You're not assigned to any class yet — ask an admin to make you class teacher of a class,
          or assign you a subject in one.
        </p>
      ) : (
        <>
          <div className="card mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Class</label>
              <select className="input min-w-[180px]" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button onClick={handleSave} disabled={saving || !students.length} className="btn-primary">
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          {students.length > 0 && (
            <div className="card !p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                    <th className="px-5 py-3">Roll No.</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className="border-b border-navy-50 last:border-0">
                      <td className="px-5 py-3 text-navy-500">{s.rollNumber || "-"}</td>
                      <td className="px-5 py-3 font-medium text-navy-900">{s.firstName} {s.lastName}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(s._id, opt.value)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                statusMap[s._id] === opt.value
                                  ? `${opt.color} text-white`
                                  : "bg-navy-50 text-navy-500 hover:bg-navy-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!selectedClass && (
            <p className="mt-4 text-center text-sm text-navy-400">Select a class to begin marking attendance.</p>
          )}
        </>
      )}
    </div>
  );
}
