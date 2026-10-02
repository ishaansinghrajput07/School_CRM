import { useEffect, useState } from "react";
import { Download, TrendingUp, AlertCircle, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { resultsApi, marksApi, studentsApi, externalResultsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";

const GRADE_TONE = {
  O: "text-teal-600",
  "A+": "text-teal-600",
  A: "text-violet-600",
  "B+": "text-navy-600",
  B: "text-amber-600",
  C: "text-amber-600",
  F: "text-red-600",
};

export default function StudentResults() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [cgpa, setCgpa] = useState(0);
  const [meetsMinimum, setMeetsMinimum] = useState(true);
  const [minimumRequired, setMinimumRequired] = useState(3);
  const [canSelfEnter, setCanSelfEnter] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadResults = () =>
    resultsApi.mine().then(({ data }) => {
      setSemesters(data.semesters);
      setCgpa(data.cgpa);
      setMeetsMinimum(data.meetsMinimum ?? true);
      setMinimumRequired(data.minimumRequired ?? 3);
      setCanSelfEnter(Boolean(data.canSelfEnter));
      setLoading(false);
    });

  useEffect(() => {
    loadResults();
  }, []);

  const chartData = semesters.map((s) => ({ semester: s.semester, SGPA: s.sgpa }));

  if (loading) return <p className="text-sm text-navy-400">Loading results...</p>;

  return (
    <div>
      <PageHeader
        title="Results"
        description="Subject-wise marks, SGPA per semester, and your cumulative CGPA"
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Download size={16} /> Download / Print
          </button>
        }
      />

      {!meetsMinimum && (
        <div className="mb-6 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            You have {semesters.length} of {minimumRequired} required result(s) on file. Every student needs at least{" "}
            {minimumRequired} recorded results before promotion to the next class.
            {canSelfEnter ? " Use the form below to add your own." : " Ask your class teacher or admin to enter them."}
          </p>
        </div>
      )}

      {semesters.length === 0 && !canSelfEnter && (
        <p className="mb-6 rounded-lg bg-navy-50 px-4 py-6 text-center text-sm text-navy-400">
          No results published yet — check back once your teachers enter marks.
        </p>
      )}

      {semesters.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-xs font-medium text-navy-400">Student</p>
              <p className="mt-1 font-display text-lg font-bold text-navy-900">{user?.name}</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium text-navy-400">Cumulative CGPA</p>
              <p className="mt-1 font-display text-2xl font-bold text-teal-600">{cgpa.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="flex items-center gap-1.5 text-xs font-medium text-navy-400">
                Semesters recorded
                {meetsMinimum && <CheckCircle2 size={13} className="text-teal-500" />}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-navy-900">{semesters.length}</p>
            </div>
          </div>

          {semesters.length > 1 && (
            <div className="card mb-6">
              <p className="mb-4 flex items-center gap-1.5 font-display text-sm font-semibold text-navy-900">
                <TrendingUp size={16} className="text-violet-500" /> SGPA trend
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="SGPA" stroke="#6C5CE7" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mb-8 space-y-6">
            {semesters.map((sem) => (
              <div key={sem.semester} className="overflow-hidden rounded-xl border border-navy-100 bg-white">
                <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50 px-5 py-3">
                  <p className="font-display text-sm font-semibold text-navy-900">{sem.semester}</p>
                  <p className="text-sm font-semibold text-navy-700">SGPA {sem.sgpa.toFixed(2)}</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                    <tr>
                      <th className="px-5 py-2.5">Subject</th>
                      <th className="px-5 py-2.5">Internal</th>
                      <th className="px-5 py-2.5">External</th>
                      <th className="px-5 py-2.5">Practical</th>
                      <th className="px-5 py-2.5">Total</th>
                      <th className="px-5 py-2.5">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {sem.subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2.5 font-medium text-navy-900">{s.subject?.name}</td>
                        <td className="px-5 py-2.5 text-navy-500">{s.internal}</td>
                        <td className="px-5 py-2.5 text-navy-500">{s.external}</td>
                        <td className="px-5 py-2.5 text-navy-500">{s.practical}</td>
                        <td className="px-5 py-2.5 text-navy-700">{s.total}/{s.maxTotal} ({s.percentage}%)</td>
                        <td className={`px-5 py-2.5 font-bold ${GRADE_TONE[s.grade] || "text-navy-600"}`}>{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {canSelfEnter && <SelfEntry onSaved={loadResults} />}

      <ExternalResults />
    </div>
  );
}

// Grade 8+ students report their own marks. Below that, only a teacher/admin
// can (enforced server-side too - this UI simply doesn't render otherwise).
function SelfEntry({ onSaved }) {
  const [semesterCount, setSemesterCount] = useState(2);
  const [className, setClassName] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    studentsApi.me().then(({ data }) => {
      setSemesterCount(data.student.class?.semesterCount || 2);
      setClassName(data.student.class?.name || "");
    });
  }, []);

  const loadRoster = (sem) => {
    setLoading(true);
    marksApi
      .myRoster(sem)
      .then(({ data }) => setRoster(data.roster))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoster(semester);
  }, [semester]);

  const updateField = (subjectId, field, value) => {
    setRoster((r) =>
      r.map((row) =>
        row.subject._id === subjectId
          ? { ...row, mark: { ...(row.mark || { internal: 0, external: 0, practical: 0, maxInternal: 30, maxExternal: 60, maxPractical: 10 }), [field]: Number(value) } }
          : row
      )
    );
  };

  const saveRow = async (row) => {
    setSavingId(row.subject._id);
    try {
      const m = row.mark || {};
      await marksApi.saveMine({
        subject: row.subject._id,
        semester,
        internal: m.internal ?? 0,
        external: m.external ?? 0,
        practical: m.practical ?? 0,
        maxInternal: m.maxInternal ?? 30,
        maxExternal: m.maxExternal ?? 60,
        maxPractical: m.maxPractical ?? 10,
      });
      toast.success(`${row.subject.name} saved`);
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save mark");
    } finally {
      setSavingId(null);
    }
  };

  const semesterOptions = Array.from({ length: semesterCount }, (_, i) => `Semester ${i + 1}`);

  return (
    <div className="card mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-navy-900">Self-report your results</p>
          <p className="text-xs text-navy-400">{className} allows students to enter their own marks per subject.</p>
        </div>
        <select className="input w-auto" value={semester} onChange={(e) => setSemester(e.target.value)}>
          {semesterOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-navy-400">Loading subjects...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Internal (/30)</th>
                <th className="py-2 pr-4">External (/60)</th>
                <th className="py-2 pr-4">Practical (/10)</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {roster.map((row) => (
                <tr key={row.subject._id}>
                  <td className="py-2 pr-4 font-medium text-navy-900">{row.subject.name}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="input w-20"
                      value={row.mark?.internal ?? 0}
                      onChange={(e) => updateField(row.subject._id, "internal", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="input w-20"
                      value={row.mark?.external ?? 0}
                      onChange={(e) => updateField(row.subject._id, "external", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="input w-20"
                      value={row.mark?.practical ?? 0}
                      onChange={(e) => updateField(row.subject._id, "practical", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => saveRow(row)}
                      disabled={savingId === row.subject._id}
                      className="btn-secondary text-xs"
                    >
                      <Save size={13} /> Save
                    </button>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-navy-400">No subjects found for your class yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EMPTY_EXTERNAL = {
  examType: "10th_board",
  boardName: "",
  schoolName: "",
  year: new Date().getFullYear(),
  rollNumber: "",
  certificateNumber: "",
  remarks: "",
  subjects: [{ name: "", maxMarks: 100, marksObtained: "" }],
};

// For students who transferred in from another school - their 10th/12th
// board results, kept separate from this school's own semester marks.
// Always editable by the student (or admin) since marksheets sometimes
// need correcting after re-verification.
function ExternalResults() {
  const [results, setResults] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EXTERNAL);
  const [saving, setSaving] = useState(false);

  const load = () => externalResultsApi.mine().then(({ data }) => setResults(data.results));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_EXTERNAL);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({
      examType: r.examType,
      boardName: r.boardName,
      schoolName: r.schoolName,
      year: r.year,
      rollNumber: r.rollNumber || "",
      certificateNumber: r.certificateNumber || "",
      remarks: r.remarks || "",
      subjects: r.subjects.map((s) => ({ name: s.name, maxMarks: s.maxMarks, marksObtained: s.marksObtained })),
    });
    setModalOpen(true);
  };

  const updateSubject = (i, field, value) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.map((s, idx) => (idx === i ? { ...s, [field]: field === "name" ? value : Number(value) } : s)),
    }));
  };

  const addSubjectRow = () => setForm((f) => ({ ...f, subjects: [...f.subjects, { name: "", maxMarks: 100, marksObtained: "" }] }));
  const removeSubjectRow = (i) => setForm((f) => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await externalResultsApi.update(editingId, form);
        toast.success("External result updated");
      } else {
        await externalResultsApi.create(form);
        toast.success("External result added");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save external result");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this external result?")) return;
    await externalResultsApi.remove(id);
    toast.success("Removed");
    load();
  };

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-navy-900">Board exam results (10th / 12th)</p>
          <p className="text-xs text-navy-400">If you joined from another school, add your prior board exam results here.</p>
        </div>
        <button onClick={openNew} className="btn-secondary text-xs"><Plus size={14} /> Add result</button>
      </div>

      {results.length === 0 ? (
        <p className="rounded-lg bg-navy-50 px-4 py-5 text-center text-sm text-navy-400">No external results added yet.</p>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r._id} className="rounded-lg border border-navy-100 p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {r.examType === "10th_board" ? "Class 10th Board" : r.examType === "12th_board" ? "Class 12th Board" : "Other"} · {r.year}
                  </p>
                  <p className="text-xs text-navy-400">{r.boardName} · {r.schoolName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg font-bold text-teal-600">{r.overallPercentage}%</p>
                  <button onClick={() => openEdit(r)} className="text-xs font-semibold text-teal-600 hover:underline">Edit</button>
                  <button onClick={() => remove(r._id)} className="text-navy-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
                {r.subjects.map((s, i) => (
                  <span key={i}>{s.name}: {s.marksObtained}/{s.maxMarks}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <form onSubmit={save} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">{editingId ? "Edit" : "Add"} board result</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-navy-700"><X size={20} /></button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Exam</label>
                <select className="input" value={form.examType} onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}>
                  <option value="10th_board">Class 10th Board</option>
                  <option value="12th_board">Class 12th Board</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" className="input" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Board name</label>
                <input className="input" placeholder="CBSE, ICSE, State Board..." value={form.boardName} onChange={(e) => setForm((f) => ({ ...f, boardName: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Previous school name</label>
                <input className="input" value={form.schoolName} onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Roll number</label>
                <input className="input" value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
              </div>
              <div>
                <label className="label">Certificate number</label>
                <input className="input" value={form.certificateNumber} onChange={(e) => setForm((f) => ({ ...f, certificateNumber: e.target.value }))} />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Subjects</label>
              <div className="space-y-2">
                {form.subjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className="input" placeholder="Subject" value={s.name} onChange={(e) => updateSubject(i, "name", e.target.value)} required />
                    <input type="number" className="input w-24" placeholder="Max" value={s.maxMarks} onChange={(e) => updateSubject(i, "maxMarks", e.target.value)} />
                    <input type="number" className="input w-24" placeholder="Obtained" value={s.marksObtained} onChange={(e) => updateSubject(i, "marksObtained", e.target.value)} required />
                    <button type="button" onClick={() => removeSubjectRow(i)} className="text-navy-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addSubjectRow} className="mt-2 text-xs font-semibold text-teal-600 hover:underline">+ Add subject</button>
            </div>

            <div className="mt-4">
              <label className="label">Remarks (optional)</label>
              <input className="input" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                <Save size={16} /> {saving ? "Saving..." : "Save result"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
