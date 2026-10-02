import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { examsApi, subjectsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";

const EXAM_TYPES = [
  { value: "unit_test", label: "Unit Test" },
  { value: "mid_term", label: "Mid Term" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "annual", label: "Annual" },
  { value: "final", label: "Final" },
  { value: "practical", label: "Practical" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = { name: "", examType: "unit_test", subject: "", date: "", startTime: "", endTime: "", room: "", maxMarks: 100, syllabus: "", notifyClass: true };

export default function TeacherExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => examsApi.list().then(({ data }) => setExams(data.exams)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    subjectsApi.list().then(({ data }) => setMySubjects(data.subjects.filter((s) => s.teacher?._id === user?._id)));
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      name: exam.name,
      examType: exam.examType,
      subject: exam.subject?._id || "",
      date: exam.date?.slice(0, 10),
      startTime: exam.startTime || "",
      endTime: exam.endTime || "",
      room: exam.room || "",
      maxMarks: exam.maxMarks,
      syllabus: exam.syllabus || "",
      notifyClass: false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const subjectDoc = mySubjects.find((s) => s._id === form.subject);
      const payload = { ...form, class: subjectDoc?.class?._id };
      if (editingId) {
        await examsApi.update(editingId, payload);
        toast.success("Exam updated");
      } else {
        await examsApi.create(payload);
        toast.success("Exam scheduled and class notified");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this scheduled exam?")) return;
    await examsApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Exams & Tests"
        description="Schedule tests for the subjects assigned to you"
        action={<button onClick={openCreate} disabled={mySubjects.length === 0} className="btn-primary disabled:opacity-50"><Plus size={16} /> Schedule Exam</button>}
      />
      {mySubjects.length === 0 && !loading && (
        <p className="mb-4 text-sm text-navy-400">You don't have any subjects assigned yet — ask an admin to assign you to a subject first.</p>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 bg-surface text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Exam</th>
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Date & Time</th>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50 stagger-rows">
            {loading && <TableSkeleton rows={5} cols={6} />}
            {!loading && exams.map((ex, i) => (
              <tr key={ex._id} style={{ "--i": i }}>
                <td className="px-5 py-3">
                  <p className="font-medium text-navy-800">{ex.name}</p>
                  <span className="badge bg-violet-50 text-violet-700 capitalize">{ex.examType.replace(/_/g, " ")}</span>
                </td>
                <td className="px-5 py-3 text-navy-500">{ex.class?.name}</td>
                <td className="px-5 py-3 text-navy-500">{ex.subject?.name}</td>
                <td className="px-5 py-3 text-navy-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} /> {new Date(ex.date).toLocaleDateString()} {ex.startTime && `· ${ex.startTime}${ex.endTime ? "-" + ex.endTime : ""}`}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy-500">
                  {ex.room ? <span className="inline-flex items-center gap-1"><MapPin size={13} /> {ex.room}</span> : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEdit(ex)} className="text-navy-300 hover:text-navy-600"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(ex._id)} className="text-navy-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && exams.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-navy-400">No exams scheduled yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 my-8">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">{editingId ? "Edit Exam" : "Schedule Exam"}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Exam Name</label>
                <input required className="input" placeholder="e.g. Unit Test 2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                    {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Max Marks</label>
                  <input type="number" min={1} className="input" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Subject (class is set automatically)</label>
                <select required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select subject</option>
                  {mySubjects.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.class?.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Start</label>
                  <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="label">End</label>
                  <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Room (optional)</label>
                <input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </div>

              <div>
                <label className="label">Syllabus / notes (optional)</label>
                <textarea rows={2} className="input" value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} />
              </div>

              {!editingId && (
                <label className="flex items-center gap-2 text-sm text-navy-600">
                  <input type="checkbox" checked={form.notifyClass} onChange={(e) => setForm({ ...form, notifyClass: e.target.checked })} />
                  Also post this to the class notice board
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
