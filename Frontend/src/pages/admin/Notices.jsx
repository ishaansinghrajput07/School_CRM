import { useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { noticesApi, classesApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";
import NoticeCard, { ColorPicker } from "../../components/shared/NoticeCard";
import { NoticeCardSkeleton } from "../../components/ui/Skeleton";

const CATEGORIES = ["general", "holiday", "exam", "emergency", "event"];
const EMPTY_FORM = { title: "", content: "", category: "general", eventDate: "", audience: "all", targetClasses: [], color: "teal" };

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  const load = () =>
    noticesApi
      .list({ manage: true })
      .then(({ data }) => setNotices(data.notices))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    classesApi.list().then(({ data }) => setClasses(data.classes));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setEditingId(n._id);
    setForm({
      title: n.title,
      content: n.content,
      category: n.category,
      eventDate: n.eventDate ? n.eventDate.slice(0, 10) : "",
      audience: n.audience,
      targetClasses: n.targetClasses?.map((c) => c._id) || [],
      color: n.color || "teal",
    });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(n.imageUrl || null);
    setModalOpen(true);
  };

  const onImageChange = (e) => {
    const f = e.target.files[0];
    setImageFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const toggleClass = (id) => {
    setForm((f) => ({
      ...f,
      targetClasses: f.targetClasses.includes(id) ? f.targetClasses.filter((c) => c !== id) : [...f.targetClasses, id],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let noticeId = editingId;
      if (editingId) {
        await noticesApi.update(editingId, form);
      } else {
        const { data } = await noticesApi.create(form);
        noticeId = data.notice._id;
      }

      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        await noticesApi.uploadImage(noticeId, fd);
      }

      toast.success(editingId ? "Notice updated" : "Notice published");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this notice?")) return;
    await noticesApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notice Board"
        description="Publish holiday, exam, and event notices — choose who sees each one and give it a color"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Notice</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <NoticeCardSkeleton key={i} />)}
        {!loading && notices.map((n) => (
          <NoticeCard key={n._id} notice={n} onEdit={openEdit} onDelete={handleDelete} />
        ))}
        {!loading && notices.length === 0 && <p className="text-sm text-navy-400">No notices published yet.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 my-8">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">{editingId ? "Edit Notice" : "New Notice"}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div>
                <label className="label">Image (optional)</label>
                <p className="mb-1.5 text-xs text-navy-400">
                  Shown on the notice/event card - a poster for an Annual Function, Sports Day banner, etc.
                </p>
                {(imagePreview || existingImageUrl) && (
                  <div className="relative mb-2 inline-block">
                    <img
                      src={imagePreview || resolveFileUrl(existingImageUrl)}
                      alt="Notice"
                      className="h-24 w-40 rounded-lg border border-navy-100 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setExistingImageUrl(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-navy-900 p-1 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <label className="btn-secondary inline-flex w-fit cursor-pointer">
                  <Upload size={14} /> {existingImageUrl || imagePreview ? "Replace image" : "Upload image"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImageChange} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {(form.category === "holiday" || form.category === "exam" || form.category === "event") && (
                  <div>
                    <label className="label">Date</label>
                    <input type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Who should see this?</label>
                <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="all">Everyone (students + staff)</option>
                  <option value="students">Students only</option>
                  <option value="staff">Teachers / staff only</option>
                </select>
              </div>

              {(form.audience === "all" || form.audience === "students") && (
                <div>
                  <label className="label">Limit to specific classes (optional)</label>
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-navy-100 bg-surface p-2 max-h-32 overflow-y-auto">
                    {classes.map((c) => (
                      <button
                        type="button"
                        key={c._id}
                        onClick={() => toggleClass(c._id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          form.targetClasses.includes(c._id) ? "bg-navy-900 text-white" : "bg-white text-navy-500 border border-navy-100"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                    {classes.length === 0 && <p className="px-1 py-1 text-xs text-navy-400">No classes set up yet.</p>}
                  </div>
                  <p className="mt-1 text-xs text-navy-400">
                    {form.targetClasses.length === 0 ? "Leave empty to send to every class." : `Sending to ${form.targetClasses.length} class(es) only.`}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Card color</label>
                <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea required rows={4} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Save changes" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}