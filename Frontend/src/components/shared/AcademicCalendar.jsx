import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { calendarApi, noticesApi } from "../../api/endpoints";
import PageHeader from "../ui/PageHeader";

const TYPE_STYLE = {
  holiday: { dot: "bg-teal-500", label: "Holiday" },
  exam: { dot: "bg-red-500", label: "Exam" },
  event: { dot: "bg-navy-500", label: "Event" },
  assignment: { dot: "bg-amber-500", label: "Assignment due" },
  project: { dot: "bg-violet-500", label: "Project due" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AcademicCalendar({ description, canManage = false }) {
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "holiday", eventDate: "", content: "" });

  const loadEvents = () => calendarApi.events().then(({ data }) => setEvents(data.events));

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await noticesApi.create({ ...form, audience: "all", isActive: true });
      toast.success(
        form.category === "holiday"
          ? "Holiday added - parents are being notified by SMS"
          : "Added to the calendar"
      );
      setModalOpen(false);
      setForm({ title: "", category: "holiday", eventDate: "", content: "" });
      loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add event");
    }
  };

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const changeMonth = (delta) => setCursor(new Date(year, month + delta, 1));

  const selectedEvents = selectedDay ? eventsByDate.get(selectedDay.toDateString()) || [] : [];

  return (
    <div>
      <PageHeader
        title="Academic Calendar"
        description={description || "Assignments, projects, exams and holidays, all in one place"}
        action={
          canManage && (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Event
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {Object.entries(TYPE_STYLE).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-navy-500">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50">
              <ChevronLeft size={18} />
            </button>
            <p className="font-display font-semibold text-navy-900">
              {cursor.toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
            <button onClick={() => changeMonth(1)} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-navy-400">
            {WEEKDAYS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const dayEvents = eventsByDate.get(date.toDateString()) || [];
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(date)}
                  className={`flex h-16 flex-col items-start rounded-lg border p-1.5 text-left transition-colors ${
                    isSelected ? "border-teal-400 bg-teal-50" : "border-navy-50 hover:bg-navy-50"
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-white" : "text-navy-600"}`}>
                    {date.getDate()}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${TYPE_STYLE[e.type]?.dot || "bg-navy-300"}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <p className="mb-3 font-display text-sm font-semibold text-navy-900">
            {selectedDay ? selectedDay.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" }) : "Select a day"}
          </p>
          {selectedDay && selectedEvents.length === 0 && <p className="text-sm text-navy-400">Nothing scheduled.</p>}
          <div className="space-y-2.5">
            {selectedEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-lg bg-navy-50 px-3 py-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${TYPE_STYLE[e.type]?.dot}`} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{TYPE_STYLE[e.type]?.label}</p>
                  <p className="text-sm text-navy-700">{e.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">Add to Calendar</h3>
              <button onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-navy-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Diwali Break" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="holiday">Holiday (SMS's every parent)</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input required type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Details</label>
                <textarea required rows={2} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
