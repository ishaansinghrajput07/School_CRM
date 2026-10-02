import { useEffect, useState } from "react";
import { Plus, X, Users, Calendar, MapPin, Trash2, Pencil, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { eventsApi, classesApi } from "../../api/endpoints";
import { getSocket, joinEventRoom, leaveEventRoom } from "../../api/socket";
import PageHeader from "../../components/ui/PageHeader";
import { Shimmer } from "../../components/ui/Skeleton";

const CATEGORIES = ["academic", "sports", "cultural", "workshop", "other"];
const EMPTY_FORM = {
  title: "",
  description: "",
  category: "other",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  capacity: "",
  registrationDeadline: "",
  audience: "all",
  targetClasses: [],
};

export default function AdminEvents() {
  const [events, setEvents] = useState(null);
  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [registrantsFor, setRegistrantsFor] = useState(null); // event object or null
  const [registrants, setRegistrants] = useState(null);

  const load = () =>
    eventsApi
      .list({ manage: "true" })
      .then(({ data }) => setEvents(data.events))
      .catch(() => setEvents([]));

  useEffect(() => {
    load();
    classesApi.list().then(({ data }) => setClasses(data.classes)).catch(() => {});
  }, []);

  // Live seat counts on the management list too
  useEffect(() => {
    if (!events?.length) return;
    const socket = getSocket();
    events.forEach((e) => joinEventRoom(e._id));
    const onCount = ({ eventId, registeredCount }) => {
      setEvents((prev) => prev?.map((e) => (e._id === eventId ? { ...e, registeredCount } : e)));
    };
    socket?.on("event:count", onCount);
    return () => {
      events.forEach((e) => leaveEventRoom(e._id));
      socket?.off("event:count", onCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events?.length]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (e) => {
    setEditingId(e._id);
    setForm({
      title: e.title,
      description: e.description || "",
      category: e.category,
      date: e.date ? e.date.slice(0, 10) : "",
      startTime: e.startTime || "",
      endTime: e.endTime || "",
      location: e.location || "",
      capacity: e.capacity || "",
      registrationDeadline: e.registrationDeadline ? e.registrationDeadline.slice(0, 10) : "",
      audience: e.audience,
      targetClasses: e.targetClasses?.map((c) => (typeof c === "string" ? c : c._id)) || [],
    });
    setModalOpen(true);
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
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : undefined };
      if (editingId) {
        await eventsApi.update(editingId, payload);
        toast.success("Event updated");
      } else {
        await eventsApi.create(payload);
        toast.success("Event created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this event and all its registrations? This can't be undone.")) return;
    try {
      await eventsApi.remove(id);
      toast.success("Event deleted");
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const viewRegistrants = async (event) => {
    setRegistrantsFor(event);
    setRegistrants(null);
    try {
      const { data } = await eventsApi.registrants(event._id);
      setRegistrants(data.registrants);
    } catch {
      setRegistrants([]);
      toast.error("Couldn't load registrants");
    }
  };

  const exportCsv = () => {
    if (!registrants?.length) return;
    const rows = [["Name", "Role", "Class", "Registered At"], ...registrants.map((r) => [r.name, r.role, r.classLabel || "", new Date(r.createdAt).toLocaleString("en-IN")])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${registrantsFor.title.replace(/\s+/g, "_")}_registrants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Events"
        description="Create school events and manage who's registered."
        action={
          <button onClick={openCreate} className="btn-glow flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900">
            <Plus size={16} /> New Event
          </button>
        }
      />

      {events === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-navy-100 bg-white p-5">
              <Shimmer className="h-4 w-1/3" />
              <Shimmer className="mt-3 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-white py-16 text-center">
          <Calendar size={32} className="text-navy-300" />
          <p className="mt-3 font-medium text-navy-600">No events yet</p>
          <p className="mt-1 text-sm text-navy-400">Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-navy-900">{e.title}</p>
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium capitalize text-navy-500">{e.category}</span>
                  {!e.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">Inactive</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {e.location && <span className="flex items-center gap-1"><MapPin size={12} /> {e.location}</span>}
                  <span className="flex items-center gap-1"><Users size={12} /> {e.registeredCount}{e.capacity ? ` / ${e.capacity}` : ""} registered</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => viewRegistrants(e)} className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-100">
                  View registrants
                </button>
                <button onClick={() => openEdit(e)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-navy-500 hover:bg-navy-50">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => remove(e._id)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy-900">{editingId ? "Edit event" : "New event"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-navy-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="label">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start time</label>
                  <input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="10:00 AM" className="input" />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="1:00 PM" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Capacity (optional)</label>
                  <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Unlimited" className="input" />
                </div>
                <div>
                  <label className="label">Registration deadline</label>
                  <input type="date" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Audience</label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="input">
                  <option value="all">Everyone</option>
                  <option value="students">Students only</option>
                  <option value="staff">Staff only</option>
                </select>
              </div>
              {form.audience !== "staff" && (
                <div>
                  <label className="label">Limit to specific classes (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((c) => (
                      <button
                        type="button"
                        key={c._id}
                        onClick={() => toggleClass(c._id)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          form.targetClasses.includes(c._id) ? "border-navy-700 bg-navy-800 text-white" : "border-navy-200 text-navy-500 hover:border-navy-400"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-500 hover:bg-navy-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-60">
                  {saving && <Loader2 size={14} className="animate-spin" />} {editingId ? "Save changes" : "Create event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrants modal */}
      {registrantsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900">{registrantsFor.title}</h2>
                <p className="text-xs text-navy-400">{registrants?.length ?? "…"} registered</p>
              </div>
              <div className="flex items-center gap-2">
                {registrants?.length > 0 && (
                  <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg bg-navy-50 px-2.5 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-100">
                    <Download size={13} /> CSV
                  </button>
                )}
                <button onClick={() => setRegistrantsFor(null)} className="text-navy-400 hover:text-navy-700"><X size={18} /></button>
              </div>
            </div>
            {registrants === null ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Shimmer key={i} className="h-10 w-full" />)}
              </div>
            ) : registrants.length === 0 ? (
              <p className="py-8 text-center text-sm text-navy-400">No one has registered yet.</p>
            ) : (
              <div className="space-y-1.5">
                {registrants.map((r) => (
                  <div key={r._id} className="flex items-center justify-between rounded-lg bg-navy-50/60 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-navy-800">{r.name}</p>
                      <p className="text-xs text-navy-400 capitalize">{r.role}{r.classLabel ? ` · ${r.classLabel}` : ""}</p>
                    </div>
                    <span className="text-xs text-navy-300">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
