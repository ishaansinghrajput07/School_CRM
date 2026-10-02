import { useEffect, useState } from "react";
import { Plus, Trash2, Save, FileText, Upload, X } from "lucide-react";
import { classesApi, syllabusApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";

const EMPTY_SUBJECT = () => ({ name: "", topics: [""] });

export default function AdminSyllabus() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [semester, setSemester] = useState(1);
  const [subjects, setSubjects] = useState([EMPTY_SUBJECT()]);
  const [notes, setNotes] = useState("");
  const [existingFile, setExistingFile] = useState(null); // { fileUrl, fileName } already saved
  const [newFile, setNewFile] = useState(null); // File object staged for upload
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    classesApi.list().then(({ data }) => {
      setClasses(data.classes);
      if (data.classes.length > 0) setSelectedClass(data.classes[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setSaved(false);
    setNewFile(null);
    syllabusApi.list(selectedClass).then(({ data }) => {
      const existing = data.syllabi.find((s) => s.semester === semester);
      if (existing) {
        setSubjects(existing.subjects.length ? existing.subjects.map((s) => ({ ...s, topics: [...s.topics] })) : [EMPTY_SUBJECT()]);
        setNotes(existing.notes || "");
        setExistingFile(existing.fileUrl ? { fileUrl: existing.fileUrl, fileName: existing.fileName } : null);
      } else {
        setSubjects([EMPTY_SUBJECT()]);
        setNotes("");
        setExistingFile(null);
      }
    });
  }, [selectedClass, semester]);

  const updateSubjectName = (i, name) => setSubjects((s) => s.map((sub, idx) => (idx === i ? { ...sub, name } : sub)));
  const updateTopic = (si, ti, value) =>
    setSubjects((s) => s.map((sub, idx) => (idx === si ? { ...sub, topics: sub.topics.map((t, tidx) => (tidx === ti ? value : t)) } : sub)));
  const addTopic = (si) => setSubjects((s) => s.map((sub, idx) => (idx === si ? { ...sub, topics: [...sub.topics, ""] } : sub)));
  const removeTopic = (si, ti) =>
    setSubjects((s) => s.map((sub, idx) => (idx === si ? { ...sub, topics: sub.topics.filter((_, tidx) => tidx !== ti) } : sub)));
  const addSubject = () => setSubjects((s) => [...s, EMPTY_SUBJECT()]);
  const removeSubject = (i) => setSubjects((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const cleaned = subjects
        .filter((s) => s.name.trim())
        .map((s) => ({ name: s.name.trim(), topics: s.topics.map((t) => t.trim()).filter(Boolean) }));

      const fd = new FormData();
      fd.append("class", selectedClass);
      fd.append("semester", semester);
      fd.append("subjects", JSON.stringify(cleaned));
      fd.append("notes", notes);
      if (newFile) fd.append("file", newFile);

      const { data } = await syllabusApi.save(fd);
      setExistingFile(data.syllabus.fileUrl ? { fileUrl: data.syllabus.fileUrl, fileName: data.syllabus.fileName } : null);
      setNewFile(null);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const currentClass = classes.find((c) => c._id === selectedClass);

  return (
    <div>
      <PageHeader title="Syllabus" description="What's shown in the homepage's Academics section, by class and semester" />

      <div className="card mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Class</label>
          <select className="input min-w-[180px]" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {currentClass?.semesterCount > 1 && (
          <div>
            <label className="label">Semester</label>
            <select className="input" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {Array.from({ length: currentClass.semesterCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <label className="label">Full syllabus PDF (optional)</label>
        <p className="mb-3 text-xs text-navy-400">
          Shown as a downloadable link on the homepage alongside the subject/topic list below - not instead of it.
        </p>

        {existingFile && !newFile && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-navy-100 bg-navy-50/50 px-4 py-2.5">
            <a
              href={resolveFileUrl(existingFile.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:underline"
            >
              <FileText size={15} /> {existingFile.fileName || "Current syllabus.pdf"}
            </a>
            <span className="text-xs text-navy-400">Uploading a new file below will replace this</span>
          </div>
        )}

        {newFile && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-teal-700">
              <FileText size={15} /> {newFile.name} <span className="text-xs text-teal-500">(will upload on save)</span>
            </span>
            <button onClick={() => setNewFile(null)} className="text-navy-400 hover:text-navy-700">
              <X size={15} />
            </button>
          </div>
        )}

        <label className="btn-secondary inline-flex w-fit cursor-pointer">
          <Upload size={15} /> {existingFile ? "Replace PDF" : "Upload PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setNewFile(e.target.files[0] || null)}
          />
        </label>
      </div>

      <div className="space-y-4">
        {subjects.map((sub, si) => (
          <div key={si} className="card">
            <div className="mb-3 flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Subject name (e.g. Mathematics)"
                value={sub.name}
                onChange={(e) => updateSubjectName(si, e.target.value)}
              />
              <button onClick={() => removeSubject(si)} className="rounded-lg p-2 text-red-400 hover:bg-red-50" title="Remove subject">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2 pl-2">
              {sub.topics.map((topic, ti) => (
                <div key={ti} className="flex items-center gap-2">
                  <input
                    className="input"
                    placeholder={`Topic ${ti + 1}`}
                    value={topic}
                    onChange={(e) => updateTopic(si, ti, e.target.value)}
                  />
                  <button onClick={() => removeTopic(si, ti)} className="rounded-lg p-2 text-navy-300 hover:bg-navy-50" title="Remove topic">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => addTopic(si)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
                <Plus size={13} /> Add topic
              </button>
            </div>
          </div>
        ))}

        <button onClick={addSubject} className="btn-secondary">
          <Plus size={16} /> Add subject
        </button>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Reference books, exam pattern notes" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving || !selectedClass} className="btn-primary">
            <Save size={16} /> {saving ? "Saving..." : "Save syllabus"}
          </button>
          {saved && <span className="text-sm font-medium text-teal-600">Saved - now live on the homepage</span>}
        </div>
      </div>
    </div>
  );
}
