import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { subjectsApi, classesApi, staffApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const EMPTY_FORM = { name: "", code: "", class: "", teacher: "" };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, set = editing that subject
  const [form, setForm] = useState(EMPTY_FORM);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: "", email: "" });
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [lastCredentials, setLastCredentials] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => subjectsApi.list().then(({ data }) => setSubjects(data.subjects));
  const loadTeachers = () => staffApi.teachers().then(({ data }) => setTeachers(data.teachers));

  useEffect(() => {
    load();
    classesApi.list().then(({ data }) => setClasses(data.classes));
    loadTeachers();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setLastCredentials(null);
    setModalOpen(true);
  };

  // Opens the same modal pre-filled so admins can (re)assign a teacher, or
  // move a subject to a different class, on an existing subject.
  const openEditModal = (subject) => {
    setEditingId(subject._id);
    setForm({
      name: subject.name,
      code: subject.code || "",
      class: subject.class?._id || "",
      teacher: subject.teacher?._id || "",
    });
    setLastCredentials(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await subjectsApi.update(editingId, form);
        toast.success("Subject updated — teacher assignment saved");
      } else {
        await subjectsApi.create(form);
        toast.success("Subject created");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this subject? Assignments and projects linked to it will remain but lose this reference.")) return;
    await subjectsApi.remove(id);
    load();
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setCreatingTeacher(true);
    try {
      const { data } = await staffApi.createTeacher(teacherForm);
      toast.success(`Teacher account created for ${teacherForm.name}`);
      setLastCredentials(data.credentials);
      await loadTeachers();
      setForm((f) => ({ ...f, teacher: data.teacher.id }));
      setAddingTeacher(false);
      setTeacherForm({ name: "", email: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create teacher");
    } finally {
      setCreatingTeacher(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Subjects tie a class to a teacher — assignments and projects are created against them"
        action={
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> New Subject
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Faculty</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {subjects.map((s) => (
              <tr key={s._id}>
                <td className="px-5 py-3 font-medium text-navy-900">{s.name}</td>
                <td className="px-5 py-3 text-navy-500">{s.code || "—"}</td>
                <td className="px-5 py-3 text-navy-500">{s.class?.name || "—"}</td>
                <td className="px-5 py-3">
                  {s.teacher?.name ? (
                    <span className="text-navy-500">{s.teacher.name}</span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-600">Unassigned</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => openEditModal(s)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                      title="Assign / change teacher"
                    >
                      <Pencil size={14} /> Assign teacher
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="text-navy-300 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-navy-400">
                  No subjects yet — create one to unlock assignments and projects.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">
              {editingId ? "Assign / Change Teacher" : "New Subject"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Subject name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Data Structures" />
              </div>
              <div>
                <label className="label">Code (optional)</label>
                <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS-301" />
              </div>
              <div>
                <label className="label">Class</label>
                <select required className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Faculty (Teacher)</label>
                <select className="input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingTeacher((v) => !v)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  <UserPlus size={13} /> {addingTeacher ? "Cancel" : "Add a new teacher"}
                </button>
              </div>

              {addingTeacher && (
                <div className="space-y-3 rounded-lg border border-navy-100 bg-surface p-4">
                  <div>
                    <label className="label">Teacher name</label>
                    <input
                      className="input"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      placeholder="Ms. Anjali Verma"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder="teacher@school.edu"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateTeacher}
                    disabled={creatingTeacher || !teacherForm.name || !teacherForm.email}
                    className="btn-secondary w-full !py-2 text-xs disabled:opacity-50"
                  >
                    {creatingTeacher ? "Creating..." : "Create teacher account"}
                  </button>
                </div>
              )}

              {lastCredentials && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Share these once — {lastCredentials.email} / {lastCredentials.tempPassword}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
