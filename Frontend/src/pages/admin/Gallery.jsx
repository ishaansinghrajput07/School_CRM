import { useEffect, useState } from "react";
import { Upload, Trash2, X, EyeOff, Eye, Star } from "lucide-react";
import { galleryApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";

const CATEGORIES = ["campus", "events", "sports", "academics", "cultural", "activities"];

export default function AdminGallery() {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: "", category: "campus", caption: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => galleryApi.list(filter === "all" ? undefined : filter).then(({ data }) => {
  console.log("Gallery API:", data);
  setPhotos(data.photos || []);
})
.catch((err) => {
  console.error("Gallery Error:", err);
});;
  useEffect(() => { load(); }, [filter]);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose an image");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("caption", form.caption);
      await galleryApi.upload(fd);
      setShowForm(false);
      setForm({ title: "", category: "campus", caption: "" });
      setFile(null);
      setPreview(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (photo) => {
    await galleryApi.update(photo._id, (() => {
      const fd = new FormData();
      fd.append("isActive", String(!photo.isActive));
      return fd;
    })());
    load();
  };

  const toggleFeatured = async (photo) => {
    await galleryApi.update(photo._id, (() => {
      const fd = new FormData();
      fd.append("featured", String(!photo.featured));
      return fd;
    })());
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    await galleryApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Photos shown on the public homepage - sports day, fest, campus, and more"
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Upload size={16} /> Upload photo</button>}
      />

      {showForm && (
        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-navy-900">Upload a photo</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-300 hover:text-navy-600"><X size={18} /></button>
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} className="input" required />
              {preview && <img src={preview} alt="Preview" className="mt-3 h-32 w-32 rounded-lg object-cover" />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Title (optional)</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Sports Day 2026" />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input capitalize" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Caption (optional)</label>
              <input className="input" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Shown on hover on the homepage" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Uploading..." : "Upload"}</button>
          </form>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${filter === c ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-500"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <div key={p._id} className="group relative aspect-square overflow-hidden rounded-xl border border-navy-100">
            <img src={resolveFileUrl(p.imageUrl)} alt={p.title || "Gallery"} className={`h-full w-full object-cover ${!p.isActive ? "opacity-40" : ""}`} />
            {p.featured && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-navy-900">
                <Star size={10} fill="currentColor" /> Hero
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-navy-700">{p.category}</span>
              <div className="flex gap-1">
                <button onClick={() => toggleFeatured(p)} className={`rounded-full p-1.5 hover:bg-white ${p.featured ? "bg-amber-500 text-navy-900" : "bg-white/90 text-navy-700"}`} title={p.featured ? "Remove from hero" : "Feature on homepage hero"}>
                  <Star size={13} fill={p.featured ? "currentColor" : "none"} />
                </button>
                <button onClick={() => toggleActive(p)} className="rounded-full bg-white/90 p-1.5 text-navy-700 hover:bg-white" title={p.isActive ? "Hide from homepage" : "Show on homepage"}>
                  {p.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => remove(p._id)} className="rounded-full bg-white/90 p-1.5 text-red-500 hover:bg-white">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="col-span-full py-8 text-center text-sm text-navy-400">No photos in this category yet.</p>}
      </div>
    </div>
  );
}
