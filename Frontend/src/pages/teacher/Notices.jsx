import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { noticesApi, classesApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import NoticeCard, { ColorPicker } from "../../components/shared/NoticeCard";
import { NoticeCardSkeleton } from "../../components/ui/Skeleton";

const EMPTY_FORM = { title: "", content: "", category: "general", eventDate: "", color: "sky", targetClasses: [] };

export default function TeacherNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    noticesApi
      .list({ activeOnly: true })
      .then(({ data }) => setNotices(data.notices))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Only classes where this teacher is the actual class teacher can
    // receive a "from your class teacher" notice - not classes they merely
    // teach a subject in.
    classesApi.list().then(({ data }) => {
      setMyClasses(data.classes.filter((c) => c.classTeacher?._id === user?._id));
    });
  }, [user]);

  const myNotices = notices.filter((n) => n.postedBy?._id === user?._id || n.postedBy === user?._id);
  const otherNotices = notices.filter((n) => !(n.postedBy?._id === user?._id || n.postedBy === user?._id));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await noticesApi.create(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not post notice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notice Board"
        description="School-wide announcements, plus notices you post to your own class"
        action={
          myClasses.length > 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Megaphone size={16} /> Post to my class
            </button>
          )
        }
      />

      {showForm && (
        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-navy-900">New class notice</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-300 hover:text-navy-600"><X size={18} /></button>
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={3} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="general">General</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="label">Date (optional)</label>
                <input type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Send to</label>
              <div className="flex flex-wrap gap-3">
                {myClasses.map((c) => (
                  <label key={c._id} className="flex items-center gap-1.5 text-sm text-navy-600">
                    <input
                      type="checkbox"
                      checked={form.targetClasses.includes(c._id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          targetClasses: e.target.checked
                            ? [...form.targetClasses, c._id]
                            : form.targetClasses.filter((id) => id !== c._id),
                        })
                      }
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-navy-400">You can only send to classes you're the class teacher of.</p>
            </div>
            <div>
              <label className="label">Color</label>
              <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            </div>
            <button type="submit" disabled={saving || form.targetClasses.length === 0} className="btn-primary">
              {saving ? "Posting..." : "Post notice"}
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <NoticeCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && myNotices.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 font-display text-sm font-semibold text-navy-500">Posted by you</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myNotices.map((n) => (
              <NoticeCard key={n._id} notice={n} onDelete={(id) => noticesApi.remove(id).then(load)} />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div>
          {myNotices.length > 0 && <h3 className="mb-3 font-display text-sm font-semibold text-navy-500">School &amp; staff notices</h3>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherNotices.map((n) => <NoticeCard key={n._id} notice={n} />)}
            {notices.length === 0 && <p className="text-sm text-navy-400">No notices at this time.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
