import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { settingsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import { Shimmer } from "../../components/ui/Skeleton";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.get().then(({ data }) => setForm(data.settings));
  }, []);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day) ? f.workingDays.filter((d) => d !== day) : [...f.workingDays, day],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await settingsApi.update(form);
      setForm(data.settings);
      toast.success("School settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div>
        <PageHeader title="School Settings" description="School identity, timing, and working days" />
        <div className="card space-y-4"><Shimmer className="h-5 w-1/3" /><Shimmer className="h-10 w-full" /><Shimmer className="h-10 w-full" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="School Settings" description="School identity, timing, and working days — shown across student, teacher and parent portals" />

      <form onSubmit={handleSave} className="card max-w-2xl space-y-5">
        <div>
          <label className="label">School Name</label>
          <input className="input" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">School Start Time</label>
            <input type="time" className="input" value={form.schoolStartTime} onChange={(e) => setForm({ ...form, schoolStartTime: e.target.value })} />
          </div>
          <div>
            <label className="label">School End Time</label>
            <input type="time" className="input" value={form.schoolEndTime} onChange={(e) => setForm({ ...form, schoolEndTime: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  form.workingDays.includes(day) ? "bg-navy-900 text-white" : "bg-surface text-navy-500 border border-navy-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Phone</label>
            <input className="input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
