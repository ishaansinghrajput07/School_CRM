import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { marksApi, subjectsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

export default function TeacherMarks() {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [roster, setRoster] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    subjectsApi.list().then(({ data }) => {
      setSubjects(data.subjects);
      if (data.subjects[0]) setSubject(data.subjects[0]._id);
    });
  }, []);

  const load = () => {
    if (!subject || !semester) return;
    marksApi.roster(subject, semester).then(({ data }) => setRoster(data.roster));
  };
  useEffect(() => { load(); }, [subject, semester]);

  const updateRow = (studentId, field, value) => {
    setRoster((r) =>
      r.map((row) =>
        row.student._id === studentId
          ? { ...row, mark: { ...(row.mark || {}), [field]: value === "" ? "" : Number(value) } }
          : row
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = roster.map((row) => ({
        student: row.student._id,
        internal: row.mark?.internal || 0,
        external: row.mark?.external || 0,
        practical: row.mark?.practical || 0,
      }));
      await marksApi.saveBulk({ subject, semester, entries });
      toast.success("Marks saved and published to students");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Marks Entry"
        description="Internal, external and practical marks — saving publishes them to students immediately"
        action={
          <button onClick={handleSave} className="btn-primary" disabled={saving || roster.length === 0}>
            <Save size={16} /> {saving ? "Saving..." : "Save & Publish"}
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <select className="input max-w-xs" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <input
          className="input max-w-xs"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester 1"
        />
      </div>

      {subjects.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You don't have any subjects yet — ask an admin to assign you as faculty first.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Roll No.</th>
                <th className="px-5 py-3">Internal (/30)</th>
                <th className="px-5 py-3">External (/60)</th>
                <th className="px-5 py-3">Practical (/10)</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="stagger-rows divide-y divide-navy-100">
              {roster.map((row, i) => {
                const m = row.mark || {};
                const total = (Number(m.internal) || 0) + (Number(m.external) || 0) + (Number(m.practical) || 0);
                return (
                  <tr key={row.student._id} style={{ "--i": i }}>
                    <td className="px-5 py-2.5 font-medium text-navy-900">
                      {row.student.firstName} {row.student.lastName}
                    </td>
                    <td className="px-5 py-2.5 text-navy-500">{row.student.rollNumber || "—"}</td>
                    <td className="px-5 py-2.5">
                      <input type="number" min={0} max={30} className="input w-20 !py-1.5" value={m.internal ?? ""} onChange={(e) => updateRow(row.student._id, "internal", e.target.value)} />
                    </td>
                    <td className="px-5 py-2.5">
                      <input type="number" min={0} max={60} className="input w-20 !py-1.5" value={m.external ?? ""} onChange={(e) => updateRow(row.student._id, "external", e.target.value)} />
                    </td>
                    <td className="px-5 py-2.5">
                      <input type="number" min={0} max={10} className="input w-20 !py-1.5" value={m.practical ?? ""} onChange={(e) => updateRow(row.student._id, "practical", e.target.value)} />
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-navy-900">{total}/100</td>
                  </tr>
                );
              })}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-navy-400">
                    No students in this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
