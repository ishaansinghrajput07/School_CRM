import { useEffect, useState } from "react";
import { Star, Check, X, Pin, PinOff, Trash2, Pencil, Save, Loader2, MessageSquareQuote } from "lucide-react";
import toast from "react-hot-toast";
import { feedbackApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Avatar from "../../components/ui/Avatar";
import { Shimmer } from "../../components/ui/Skeleton";
import { getSocket } from "../../api/socket";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved (live)" },
  { key: "rejected", label: "Rejected" },
];

export default function Feedback() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = (status) => {
    setItems(null);
    feedbackApi
      .list({ status })
      .then(({ data }) => setItems(data.feedback))
      .catch(() => {
        setItems([]);
        toast.error("Couldn't load feedback");
      });
  };

  useEffect(() => load(tab), [tab]);

  // Live updates: when a new submission comes in while an admin is on this
  // page, surface it immediately instead of requiring a manual refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (payload) => {
      toast(`New feedback from ${payload.name} (${payload.rating}★)`, { icon: "📝" });
      if (tab === "pending") load("pending");
    };
    socket.on("feedback:new", onNew);
    return () => socket.off("feedback:new", onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const act = async (id, patch, successMsg) => {
    setBusyId(id);
    try {
      await feedbackApi.update(id, patch);
      toast.success(successMsg);
      setItems((prev) => prev.filter((f) => f._id !== id || tab === "approved"));
      // If we just changed status away from the current tab, drop it from view
      if (patch.status && patch.status !== tab) {
        setItems((prev) => prev.filter((f) => f._id !== id));
      } else {
        load(tab);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this feedback permanently? This can't be undone.")) return;
    setBusyId(id);
    try {
      await feedbackApi.remove(id);
      toast.success("Deleted");
      setItems((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (f) => {
    setEditingId(f._id);
    setEditText(f.editedMessage || f.message);
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      await feedbackApi.update(id, { editedMessage: editText });
      toast.success("Updated what shows on the site");
      setEditingId(null);
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = (f) => act(f._id, { featured: !f.featured }, f.featured ? "Unpinned" : "Pinned to top");

  return (
    <div>
      <PageHeader title="Feedback" description="Review parent, student and alumni feedback before it appears on the public website." />

      <div className="mb-5 flex gap-1 rounded-xl bg-navy-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-navy-100 bg-white p-5">
              <Shimmer className="h-4 w-1/3" />
              <Shimmer className="mt-3 h-3 w-full" />
              <Shimmer className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-white py-16 text-center">
          <MessageSquareQuote size={32} className="text-navy-300" />
          <p className="mt-3 font-medium text-navy-600">Nothing here</p>
          <p className="mt-1 text-sm text-navy-400">
            {tab === "pending" ? "New submissions from the public site will show up here." : `No ${tab} feedback yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f._id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={f.name} size="sm" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy-900">{f.name}</p>
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium capitalize text-navy-500">{f.role}</span>
                      {f.context && <span className="text-xs text-navy-400">{f.context}</span>}
                      {f.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Pin size={10} /> Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} fill={i < f.rating ? "currentColor" : "none"} strokeWidth={i < f.rating ? 0 : 1.5} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-navy-300">{new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              {editingId === f._id ? (
                <div className="mt-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="input"
                    placeholder="Edit what will show publicly (the original submission is preserved)"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveEdit(f._id)}
                      disabled={busyId === f._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-900 disabled:opacity-50"
                    >
                      {busyId === f._id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-navy-400 hover:text-navy-600">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm leading-relaxed text-navy-700">"{f.editedMessage || f.message}"</p>
                  {f.editedMessage && f.editedMessage !== f.message && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-navy-400 hover:text-navy-600">View original submission</summary>
                      <p className="mt-1 text-xs italic text-navy-400">"{f.message}"</p>
                    </details>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-3">
                {tab === "pending" && (
                  <>
                    <ActionBtn onClick={() => act(f._id, { status: "approved" }, "Approved — now live on the site")} icon={Check} label="Approve" tone="teal" busy={busyId === f._id} />
                    <ActionBtn onClick={() => act(f._id, { status: "rejected" }, "Rejected")} icon={X} label="Reject" tone="red" busy={busyId === f._id} />
                  </>
                )}
                {tab === "approved" && (
                  <>
                    <ActionBtn onClick={() => toggleFeatured(f)} icon={f.featured ? PinOff : Pin} label={f.featured ? "Unpin" : "Pin to top"} tone="amber" busy={busyId === f._id} />
                    <ActionBtn onClick={() => act(f._id, { status: "pending" }, "Moved back to pending")} icon={X} label="Unpublish" tone="navy" busy={busyId === f._id} />
                  </>
                )}
                {tab === "rejected" && <ActionBtn onClick={() => act(f._id, { status: "pending" }, "Moved back to pending")} icon={Check} label="Reconsider" tone="navy" busy={busyId === f._id} />}
                {editingId !== f._id && (
                  <ActionBtn onClick={() => startEdit(f)} icon={Pencil} label="Edit text" tone="navy" busy={busyId === f._id} />
                )}
                <button
                  onClick={() => remove(f._id)}
                  disabled={busyId === f._id}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TONE_CLASSES = {
  teal: "bg-teal-50 text-teal-700 hover:bg-teal-100",
  red: "bg-red-50 text-red-600 hover:bg-red-100",
  amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  navy: "bg-navy-50 text-navy-600 hover:bg-navy-100",
};

function ActionBtn({ onClick, icon: Icon, label, tone, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${TONE_CLASSES[tone]}`}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />} {label}
    </button>
  );
}
