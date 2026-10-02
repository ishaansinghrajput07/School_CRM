import { useEffect, useState } from "react";
import { Plus, Trash2, X, Upload, Eye, EyeOff, Trophy } from "lucide-react";
import { toppersApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";

const EMPTY_FORM = { name: "", grade: "", stream: "", rank: "", percentage: "", academicYear: "" };

export default function AdminToppers() {
  const [toppers, setToppers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => toppersApi.list().then(({ data }) => setToppers(data.toppers));
  useEffect(() => { load(); }, []);

  const onPhotoChange = (e) => {
    const f = e.target.files[0];
    setPhotoFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append("photo", photoFile);
      await toppersApi.create(fd);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setPhotoFile(null);
      setPreview(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save topper");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t) => {
    const fd = new FormData();
    fd.append("isActive", String(!t.isActive));
    await toppersApi.update(t._id, fd);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Remove this topper? This can't be undone.")) return;
    await toppersApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Toppers"
        description="Academic achievers shown in the homepage's dark 'Our Toppers' section"
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add topper</button>}
      />

      {showForm && (
        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-navy-900">New topper</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-300 hover:text-navy-600"><X size={18} /></button>
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Photo (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoChange} className="input" />
              {preview && <img src={preview} alt="Preview" className="mt-3 h-24 w-24 rounded-full object-cover" />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Student name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Rank / title</label>
                <input className="input" required placeholder="School Topper, Gold Medalist..." value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
              </div>
              <div>
                <label className="label">Grade</label>
                <input className="input" required placeholder="Class X, Class XII..." value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              </div>
              <div>
                <label className="label">Stream (optional)</label>
                <input className="input" placeholder="Science, Commerce..." value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} />
              </div>
              <div>
                <label className="label">Percentage (optional)</label>
                <input type="number" min={0} max={100} className="input" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} />
              </div>
              <div>
                <label className="label">Academic year</label>
                <input className="input" required placeholder="2025-26" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Add topper"}</button>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {toppers.map((t) => (
          <div key={t._id} className={`card ${!t.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-50">
                {t.photoUrl ? (
                  <img src={resolveFileUrl(t.photoUrl)} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <Trophy size={18} className="text-navy-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy-900">{t.name}</p>
                <p className="truncate text-xs text-navy-400">{t.rank} · {t.grade}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-navy-400">
              <span>{t.academicYear}{t.percentage != null ? ` · ${t.percentage}%` : ""}</span>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(t)} className="rounded p-1 hover:bg-navy-50" title={t.isActive ? "Hide" : "Show"}>
                  {t.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => remove(t._id)} className="rounded p-1 text-red-400 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {toppers.length === 0 && <p className="col-span-full py-8 text-center text-sm text-navy-400">No toppers added yet.</p>}
      </div>
    </div>
  );
}