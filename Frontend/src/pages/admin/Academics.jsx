import { useEffect, useState } from "react";
import { Paperclip, Search, X, Save } from "lucide-react";
import { assignmentsApi, projectsApi, studentsApi, resultsApi, classesApi, staffApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import toast from "react-hot-toast";

const TABS = ["Assignments", "Projects", "Results", "Classes"];

export default function Academics() {
  const [tab, setTab] = useState("Assignments");

  return (
    <div>
      <PageHeader title="Academics" description="Cross-teacher view of assignments, projects, and student results" />

      <div className="mb-6 flex gap-1 rounded-lg bg-navy-50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-white text-navy-900 shadow-card" : "text-navy-500 hover:text-navy-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Assignments" && <WorkList type="assignment" />}
      {tab === "Projects" && <WorkList type="project" />}
      {tab === "Results" && <ResultsLookup />}
      {tab === "Classes" && <ClassManager />}
    </div>
  );
}

function WorkList({ type }) {
  const api = type === "assignment" ? assignmentsApi : projectsApi;
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.list().then(({ data }) => setItems(data.assignments || data.projects));
  }, [type]);

  const open = async (id) => {
    const { data } = await api.get(id);
    setActive(data.assignment || data.project);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Faculty</th>
              <th className="px-5 py-3">Deadline</th>
              <th className="px-5 py-3">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {items.map((a) => {
              const submitted = a.submissions?.filter((s) => s.status !== "pending").length ?? 0;
              const total = a.submissions?.length ?? 0;
              return (
                <tr key={a._id} onClick={() => open(a._id)} className="cursor-pointer hover:bg-navy-50">
                  <td className="px-5 py-3 font-medium text-navy-900">{a.title}</td>
                  <td className="px-5 py-3 text-navy-500">{a.subject?.name}</td>
                  <td className="px-5 py-3 text-navy-500">{a.createdBy?.name || "—"}</td>
                  <td className="px-5 py-3 text-navy-500">{new Date(a.deadline).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-medium text-teal-600">{total ? `${submitted}/${total}` : "—"}</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">Nothing here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-900">{active.title}</h3>
                <p className="text-sm text-navy-400">
                  {active.subject?.name} · {active.createdBy?.name} · Due {new Date(active.deadline).toLocaleString()}
                </p>
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
                <div key={s._id} className="flex items-center justify-between rounded-lg border border-navy-100 p-3.5">
                  <div>
                    <p className="font-medium text-navy-900">{s.student?.firstName} {s.student?.lastName}</p>
                    <p className="text-xs text-navy-400">Roll {s.student?.rollNumber || "—"}</p>
                  </div>
                  <Badge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null); // class being edited
  const [form, setForm] = useState({ sections: "", classTeacher: "", semesterCount: 2, allowSelfResultEntry: false, maxStudentsPerSection: 40, minAttendancePercent: 75 });
  const [saving, setSaving] = useState(false);

  const load = () => classesApi.list().then(({ data }) => setClasses(data.classes));

  useEffect(() => {
    load();
    staffApi.teachers().then(({ data }) => setTeachers(data.teachers));
  }, []);

  const openEdit = (cls) => {
    setEditing(cls);
    setForm({
      sections: (cls.sections || []).join(", "),
      classTeacher: cls.classTeacher?._id || cls.classTeacher || "",
      semesterCount: cls.semesterCount || 2,
      allowSelfResultEntry: Boolean(cls.allowSelfResultEntry),
      maxStudentsPerSection: cls.maxStudentsPerSection || 40,
      minAttendancePercent: cls.minAttendancePercent ?? 75,
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await classesApi.update(editing._id, {
        sections: form.sections.split(",").map((s) => s.trim()).filter(Boolean),
        classTeacher: form.classTeacher || null,
        semesterCount: Number(form.semesterCount) || 1,
        allowSelfResultEntry: form.allowSelfResultEntry,
        maxStudentsPerSection: Number(form.maxStudentsPerSection) || 40,
        minAttendancePercent: Number(form.minAttendancePercent),
      });
      toast.success(`${editing.name} updated`);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-navy-400">
        Assign a class teacher, set the sections, and control how many semesters each class runs. Once you assign a
        class teacher here, students in that class see it directly on their profile and ID card.
      </p>
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Sections</th>
              <th className="px-5 py-3">Students / Capacity</th>
              <th className="px-5 py-3">Class Teacher</th>
              <th className="px-5 py-3">Semesters</th>
              <th className="px-5 py-3">Self-entry allowed</th>
              <th className="px-5 py-3">Min. attendance</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {classes.map((c) => {
              const total = c.totalStudents || 0;
              const cap = (c.maxStudentsPerSection || 40) * (c.sections?.length || 1);
              const over = total > cap;
              return (
              <tr key={c._id}>
                <td className="px-5 py-3 font-medium text-navy-900">{c.name}</td>
                <td className="px-5 py-3 text-navy-500">{(c.sections || []).join(", ") || "—"}</td>
                <td className="px-5 py-3">
                  <span className={over ? "font-semibold text-amber-600" : "text-navy-500"}>{total} / {cap}</span>
                  {over && <span className="ml-1.5 badge bg-amber-50 text-amber-600">Over capacity</span>}
                </td>
                <td className="px-5 py-3 text-navy-500">{c.classTeacher?.name || "Not assigned"}</td>
                <td className="px-5 py-3 text-navy-500">{c.semesterCount || 2}</td>
                <td className="px-5 py-3">
                  <Badge status={c.allowSelfResultEntry ? "active" : "inactive"} />
                </td>
                <td className="px-5 py-3 text-navy-500">{c.minAttendancePercent ?? 75}%</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="text-xs font-semibold text-teal-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
              );
            })}
            {classes.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-navy-400">No classes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">Edit {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Sections (comma-separated)</label>
                <input
                  className="input"
                  value={form.sections}
                  onChange={(e) => setForm((f) => ({ ...f, sections: e.target.value }))}
                  placeholder="A, B, C"
                />
              </div>
              <div>
                <label className="label">Class teacher</label>
                <select
                  className="input"
                  value={form.classTeacher}
                  onChange={(e) => setForm((f) => ({ ...f, classTeacher: e.target.value }))}
                >
                  <option value="">Not assigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-navy-400">Shown to every student in this class on their profile and ID card.</p>
              </div>
              <div>
                <label className="label">Number of semesters</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input"
                  value={form.semesterCount}
                  onChange={(e) => setForm((f) => ({ ...f, semesterCount: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Max students per section</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.maxStudentsPerSection}
                  onChange={(e) => setForm((f) => ({ ...f, maxStudentsPerSection: e.target.value }))}
                />
                <p className="mt-1 text-xs text-navy-400">A planning guide, not a hard limit — you'll just see an "over capacity" flag if a section grows past this.</p>
              </div>
              <div>
                <label className="label">Minimum attendance % to sit exams</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={form.minAttendancePercent}
                  onChange={(e) => setForm((f) => ({ ...f, minAttendancePercent: e.target.value }))}
                />
                <p className="mt-1 text-xs text-navy-400">
                  Students below this get flagged as not exam-eligible. The class teacher can also adjust this from their own dashboard.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-navy-700">
                <input
                  type="checkbox"
                  checked={form.allowSelfResultEntry}
                  onChange={(e) => setForm((f) => ({ ...f, allowSelfResultEntry: e.target.checked }))}
                />
                Students in this class can self-report their own results
              </label>
              <p className="text-xs text-navy-400">
                By school policy this is normally on for Grade 8 and above - below that, only a teacher or admin should enter results.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                <Save size={16} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ResultsLookup() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [result, setResult] = useState(null);

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    classesApi.list().then(({ data }) => setClasses(data.classes));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setRoster([]);
      return;
    }
    setRosterLoading(true);
    setResult(null);
    resultsApi
      .forClass(selectedClass)
      .then(({ data }) => setRoster(data.results))
      .finally(() => setRosterLoading(false));
  }, [selectedClass]);

  useEffect(() => {
    if (query.trim().length < 2) return setOptions([]);
    const t = setTimeout(() => {
      studentsApi.list({ search: query }).then(({ data }) => setOptions(data.students.slice(0, 6)));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const pick = async (student) => {
    setQuery(`${student.firstName} ${student.lastName || ""}`.trim());
    setOptions([]);
    const { data } = await resultsApi.forStudent(student._id);
    setResult(data);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Browse by class</label>
          <select className="input min-w-[180px]" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="relative max-w-sm flex-1">
          <label className="label">...or search directly</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              className="input pl-9"
              placeholder="Search a student by name or admission no..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setResult(null); }}
            />
          </div>
          {options.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-navy-100 bg-white shadow-card">
              {options.map((s) => (
                <button key={s._id} onClick={() => pick(s)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-navy-50">
                  {s.firstName} {s.lastName} <span className="text-navy-400">· {s.admissionNumber}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedClass && !result && (
        <div className="mb-6 overflow-hidden rounded-xl border border-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-5 py-3">Roll No.</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Semesters recorded</th>
                <th className="px-5 py-3">CGPA</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {rosterLoading && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">Loading class results...</td></tr>
              )}
              {!rosterLoading && roster.map((r, i) => (
                <tr key={r.student._id} style={{ "--i": i }} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3 text-navy-500">{r.student.rollNumber || "—"}</td>
                  <td className="px-5 py-3 font-medium text-navy-900">{r.student.firstName} {r.student.lastName}</td>
                  <td className="px-5 py-3 text-navy-600">{r.semesterCount}</td>
                  <td className="px-5 py-3 font-semibold text-teal-600">{r.semesterCount ? r.cgpa.toFixed(2) : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => pick(r.student)} className="text-xs font-semibold text-teal-600 hover:underline">
                      View full result
                    </button>
                  </td>
                </tr>
              ))}
              {!rosterLoading && roster.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">No students in this class yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <button onClick={() => setResult(null)} className="mb-3 text-xs font-semibold text-navy-400 hover:text-navy-700">
            ← Back to {selectedClass ? "class list" : "search"}
          </button>
          <div className="mb-4 flex gap-4">
            <div className="card">
              <p className="text-xs text-navy-400">Student</p>
              <p className="font-display font-bold text-navy-900">{result.student?.name}</p>
            </div>
            <div className="card">
              <p className="text-xs text-navy-400">CGPA</p>
              <p className="font-display text-xl font-bold text-teal-600">{result.cgpa?.toFixed(2) ?? "0.00"}</p>
            </div>
          </div>

          {result.semesters?.length === 0 && (
            <p className="text-sm text-navy-400">No marks recorded for this student yet.</p>
          )}

          <div className="space-y-4">
            {result.semesters?.map((sem) => (
              <div key={sem.semester} className="overflow-hidden rounded-xl border border-navy-100 bg-white">
                <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50 px-5 py-2.5">
                  <p className="text-sm font-semibold text-navy-900">{sem.semester}</p>
                  <p className="text-sm text-navy-600">SGPA {sem.sgpa.toFixed(2)}</p>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-navy-100">
                    {sem.subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2 text-navy-700">{s.subject?.name}</td>
                        <td className="px-5 py-2 text-navy-500">{s.total}/{s.maxTotal}</td>
                        <td className="px-5 py-2 font-semibold text-navy-900">{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
