import { useEffect, useState } from "react";
import { Plus, Paperclip, X } from "lucide-react";
import toast from "react-hot-toast";
import { assignmentsApi, subjectsApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const emptyForm = { subject: "", title: "", description: "", instructions: "", deadline: "", maxMarks: 100 };

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [active, setActive] = useState(null); // assignment being viewed/graded

  const load = () => assignmentsApi.list().then(({ data }) => setAssignments(data.assignments));

  useEffect(() => {
    load();
    subjectsApi.list().then(({ data }) => setSubjects(data.subjects));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("attachment", file);
      await assignmentsApi.create(fd);
      toast.success("Assignment created");
      setModalOpen(false);
      setForm(emptyForm);
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    }
  };

  const openRoster = async (id) => {
    const { data } = await assignmentsApi.get(id);
    setActive(data.assignment);
  };

  const grade = async (studentId, patch) => {
    try {
      await assignmentsApi.grade(active._id, studentId, patch);
      toast.success("Saved");
      openRoster(active._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save grade");
    }
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Create subject-wise assignments and grade submissions as they come in"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary" disabled={subjects.length === 0}>
            <Plus size={16} /> New Assignment
          </button>
        }
      />

      {subjects.length === 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You don't have any subjects yet — ask an admin to create one and assign you as faculty.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => {
          const submitted = a.submissions?.filter((s) => s.status !== "pending").length ?? 0;
          const total = a.submissions?.length ?? 0;
          return (
            <button key={a._id} onClick={() => openRoster(a._id)} className="card text-left">
              <p className="text-xs font-medium text-navy-400">{a.subject?.name}</p>
              <h3 className="mt-1 font-display font-semibold text-navy-900">{a.title}</h3>
              <p className="mt-2 text-xs text-navy-400">Due {new Date(a.deadline).toLocaleDateString()}</p>
              <p className="mt-3 text-sm font-medium text-teal-600">
                {submitted}/{total} submitted
              </p>
            </button>
          );
        })}
        {assignments.length === 0 && subjects.length > 0 && (
          <p className="text-sm text-navy-400">No assignments yet — create your first one.</p>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Assignment</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Subject</label>
                <select required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment 4 — Binary Trees" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Instructions</label>
                <textarea rows={2} className="input" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Deadline</label>
                  <input required type="datetime-local" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="label">Max marks</label>
                  <input type="number" className="input" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Attachment (PDF, optional)</label>
                <input type="file" accept=".pdf,.zip" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-900">{active.title}</h3>
                <p className="text-sm text-navy-400">{active.subject?.name} · Due {new Date(active.deadline).toLocaleString()}</p>
              </div>
              <button onClick={() => setActive(null)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            {active.attachmentUrl && (
              <a href={resolveFileUrl(active.attachmentUrl)} target="_blank" rel="noreferrer" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700">
                <Paperclip size={14} /> View attachment
              </a>
            )}

            <div className="space-y-3">
              {active.submissions?.map((s) => (
                <div key={s._id} className="rounded-lg border border-navy-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy-900">
                        {s.student?.firstName} {s.student?.lastName}
                      </p>
                      <p className="text-xs text-navy-400">Roll {s.student?.rollNumber || "—"}</p>
                    </div>
                    <Badge status={s.status} />
                  </div>

                  {s.fileUrl && (
                    <a href={resolveFileUrl(s.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
                      <Paperclip size={12} /> View submission
                    </a>
                  )}

                  {(s.status === "submitted" || s.status === "late") && (
                    <GradeRow onSave={(patch) => grade(s.student._id, patch)} maxMarks={active.maxMarks} />
                  )}
                  {(s.status === "approved" || s.status === "rejected") && (
                    <p className="mt-2 text-xs text-navy-500">
                      {s.marks !== undefined && s.marks !== null ? `${s.marks}/${active.maxMarks} · ` : ""}
                      {s.remarks || "No remarks"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeRow({ onSave, maxMarks }) {
  const [marks, setMarks] = useState("");
  const [remarks, setRemarks] = useState("");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        placeholder={`/ ${maxMarks}`}
        className="input w-24 !py-1.5 text-sm"
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
      />
      <input
        placeholder="Remarks (optional)"
        className="input flex-1 !py-1.5 text-sm"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />
      <button
        onClick={() => onSave({ status: "approved", marks: marks || undefined, remarks })}
        className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
      >
        Approve
      </button>
      <button
        onClick={() => onSave({ status: "rejected", remarks })}
        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
      >
        Reject
      </button>
    </div>
  );
}
