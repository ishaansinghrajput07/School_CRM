import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, X, IdCard, Copy, CheckCircle2, Download, Users, ArrowUpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { studentsApi, classesApi } from "../../api/endpoints";
import { exportToCsv } from "../../utils/csv";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const EMPTY_FORM = {
  admissionNumber: "",
  rollNumber: "",
  firstName: "",
  lastName: "",
  bloodGroup: "",
  class: "",
  section: "",
  parent: { fatherName: "", motherName: "", email: "", phone: "" },
  loginEmail: "",
  createLogin: true,
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [credentials, setCredentials] = useState(null); // shown once right after a student is created
  const [parentModalStudent, setParentModalStudent] = useState(null);
  const [parentForm, setParentForm] = useState({ name: "", email: "" });
  const [parentCredentials, setParentCredentials] = useState(null);
  const [linkingParent, setLinkingParent] = useState(false);

  const openParentModal = (student) => {
    setParentModalStudent(student);
    setParentForm({ name: student.parent?.fatherName || "", email: student.parent?.email || "" });
    setParentCredentials(null);
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    setLinkingParent(true);
    try {
      const { data } = await studentsApi.createParentAccount(parentModalStudent._id, parentForm);
      if (data.credentials) {
        setParentCredentials(data.credentials);
        toast.success("Parent account created");
      } else {
        toast.success(data.message || "Linked to existing parent account");
        setParentModalStudent(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create parent account");
    } finally {
      setLinkingParent(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: sData }, { data: cData }] = await Promise.all([
        studentsApi.list(search ? { search } : {}),
        classesApi.list(),
      ]);
      setStudents(sData.students);
      setClasses(cData.classes);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student._id);
    setForm({
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber || "",
      firstName: student.firstName,
      lastName: student.lastName || "",
      bloodGroup: student.bloodGroup || "",
      class: student.class?._id || "",
      section: student.section || "",
      parent: student.parent || EMPTY_FORM.parent,
      loginEmail: "",
      createLogin: false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await studentsApi.update(editingId, form);
        toast.success("Student updated");
        setModalOpen(false);
      } else {
        const { data } = await studentsApi.create(form);
        toast.success("Student registered — ID card issued");
        setModalOpen(false);
        // A login + temp password was generated server-side; show it once so the
        // admin can hand it to the student/parent (it isn't retrievable later).
        if (data.credentials) {
          setCredentials({ ...data.credentials, studentId: data.student._id, name: `${data.student.firstName} ${data.student.lastName || ""}` });
        }
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this student record?")) return;
    try {
      await studentsApi.remove(id);
      toast.success("Student removed");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.tempPassword}`);
    toast.success("Copied to clipboard");
  };

  const handlePromote = async (student) => {
    if (!confirm(`Promote ${student.firstName} ${student.lastName || ""} to the next class? Their new class's fee structures will be applied automatically.`)) return;
    try {
      const { data } = await studentsApi.promote(student._id);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Promotion failed");
    }
  };

  const handleExport = () => {
    exportToCsv(
      "students",
      students.map((s) => ({
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber || "",
        name: `${s.firstName} ${s.lastName || ""}`.trim(),
        class: s.class?.name || "",
        section: s.section || "",
        phone: s.phone || "",
        parentPhone: s.parent?.phone || "",
        status: s.status,
      }))
    );
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student records, profiles, and class assignments"
        action={
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-secondary" disabled={students.length === 0}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} /> Add Student
            </button>
          </div>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            className="input pl-9"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Admission No.</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Parent Phone</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="stagger-rows">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-navy-400">Loading...</td></tr>
            )}
            {!loading && students.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-navy-400">No students found</td></tr>
            )}
            {students.map((s, i) => (
              <tr key={s._id} style={{ "--i": i }} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50">
                <td className="px-5 py-3 font-mono text-xs text-navy-600">{s.admissionNumber}</td>
                <td className="px-5 py-3 font-medium text-navy-900">{s.firstName} {s.lastName}</td>
                <td className="px-5 py-3 text-navy-600">{s.class?.name || "-"} {s.section && `· ${s.section}`}</td>
                <td className="px-5 py-3 text-navy-600">{s.parent?.phone || "-"}</td>
                <td className="px-5 py-3"><Badge status={s.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/students/${s._id}/id-card`} className="rounded p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700" aria-label="View ID Card">
                      <IdCard size={15} />
                    </Link>
                    <button onClick={() => openParentModal(s)} className="rounded p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700" aria-label="Link parent account">
                      <Users size={15} />
                    </button>
                    <button onClick={() => handlePromote(s)} className="rounded p-1.5 text-navy-400 hover:bg-teal-50 hover:text-teal-600" aria-label="Promote to next class">
                      <ArrowUpCircle size={15} />
                    </button>
                    <button onClick={() => openEdit(s)} className="rounded p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="rounded p-1.5 text-navy-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">
                {editingId ? "Edit Student" : "Add Student"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Admission Number</label>
                  <input required className="input" value={form.admissionNumber}
                    onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">Roll Number</label>
                  <input className="input" value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input required className="input" value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input" value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label">Class</label>
                  <select className="input" value={form.class}
                    onChange={(e) => setForm({ ...form, class: e.target.value })}>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Section</label>
                  <input className="input" value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Blood Group</label>
                <input className="input" placeholder="e.g. O+" value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
              </div>

              <div>
                <label className="label">Parent Phone</label>
                <input required className="input" value={form.parent.phone}
                  onChange={(e) => setForm({ ...form, parent: { ...form.parent, phone: e.target.value } })} />
              </div>

              <div>
                <label className="label">Parent Email (for absence alerts)</label>
                <input type="email" className="input" value={form.parent.email}
                  onChange={(e) => setForm({ ...form, parent: { ...form.parent, email: e.target.value } })} />
              </div>

              {!editingId && (
                <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-700">
                    <input type="checkbox" checked={form.createLogin}
                      onChange={(e) => setForm({ ...form, createLogin: e.target.checked })} />
                    Create a student login now
                  </label>
                  {form.createLogin && (
                    <div>
                      <label className="label">Login Email (defaults to parent email if left blank)</label>
                      <input type="email" className="input" value={form.loginEmail}
                        onChange={(e) => setForm({ ...form, loginEmail: e.target.value })} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? "Save Changes" : "Register Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-teal-500" size={36} />
            <h3 className="font-display text-lg font-bold text-navy-900">Login Created</h3>
            <p className="mt-1 text-sm text-navy-500">
              Share these one-time credentials with {credentials.name}. They won't be shown again.
            </p>
            <div className="mt-4 space-y-2 rounded-lg bg-navy-50 p-3 text-left text-sm">
              <p><span className="text-navy-400">Email:</span> <span className="font-mono text-navy-800">{credentials.email}</span></p>
              <p><span className="text-navy-400">Password:</span> <span className="font-mono text-navy-800">{credentials.tempPassword}</span></p>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={copyCredentials} className="btn-secondary"><Copy size={14} /> Copy</button>
              <Link to={`/admin/students/${credentials.studentId}/id-card`} onClick={() => setCredentials(null)} className="btn-secondary">
                <IdCard size={14} /> View ID Card
              </Link>
              <button onClick={() => setCredentials(null)} className="btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}

      {parentModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            {parentCredentials ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-3 text-teal-500" size={36} />
                <h3 className="font-display text-lg font-bold text-navy-900">Parent Account Created</h3>
                <p className="mt-1 text-sm text-navy-500">Share these one-time credentials. They won't be shown again.</p>
                <div className="mt-4 space-y-2 rounded-lg bg-navy-50 p-3 text-left text-sm">
                  <p><span className="text-navy-400">Email:</span> <span className="font-mono text-navy-800">{parentCredentials.email}</span></p>
                  <p><span className="text-navy-400">Password:</span> <span className="font-mono text-navy-800">{parentCredentials.tempPassword}</span></p>
                </div>
                <button onClick={() => setParentModalStudent(null)} className="btn-primary mt-4 w-full">Done</button>
              </div>
            ) : (
              <>
                <h3 className="mb-1 font-display text-lg font-bold text-navy-900">Link a Parent Account</h3>
                <p className="mb-4 text-sm text-navy-500">
                  For {parentModalStudent.firstName} {parentModalStudent.lastName}. If this email already has a parent
                  login, this student is added to it instead of creating a new one.
                </p>
                <form onSubmit={handleLinkParent} className="space-y-4">
                  <div>
                    <label className="label">Parent name</label>
                    <input required className="input" value={parentForm.name} onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input required type="email" className="input" value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setParentModalStudent(null)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={linkingParent} className="btn-primary">{linkingParent ? "Linking..." : "Link Account"}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
