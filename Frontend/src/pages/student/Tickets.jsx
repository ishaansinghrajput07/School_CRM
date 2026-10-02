import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/endpoints";
import { getSocket } from "../../api/socket";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const CATEGORIES = [
  { value: "fee_issue", label: "Fee Issue" },
  { value: "attendance_correction", label: "Attendance Correction" },
  { value: "id_card", label: "ID Card" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "general_complaint", label: "General Complaint" },
];

export default function StudentTickets() {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: "general_complaint", subject: "", description: "", assignedTo: "" });

  const load = () => ticketsApi.list({ mine: true }).then(({ data }) => setTickets(data.tickets));
  useEffect(() => {
    load();
    ticketsApi.staffList().then(({ data }) => setStaff(data.staff));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdated = (ticket) => {
      setTickets((prev) => prev.map((t) => (t._id === ticket._id ? ticket : t)));
    };
    socket.on("ticket:updated", onUpdated);
    return () => socket.off("ticket:updated", onUpdated);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ticketsApi.create(form);
      toast.success("Ticket raised");
      setModalOpen(false);
      setForm({ category: "general_complaint", subject: "", description: "", assignedTo: "" });
      load();
    } catch (err) {
      toast.error("Failed to raise ticket");
    }
  };

  return (
    <div>
      <PageHeader
        title="My Tickets"
        description="Raise and track support requests"
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Raise Ticket</button>}
      />

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Ticket #</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Forwarded to</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-navy-500">{t.ticketNumber}</td>
                <td className="px-5 py-3 font-medium text-navy-900">{t.subject}</td>
                <td className="px-5 py-3 capitalize text-navy-600">{t.category.replace(/_/g, " ")}</td>
                <td className="px-5 py-3"><Badge status={t.status} /></td>
                <td className="px-5 py-3 text-navy-500">{t.assignedTo?.name || "—"}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">You haven't raised any tickets yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">Raise a Ticket</h3>
              <button onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-navy-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea required rows={4} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Forward to (optional)</label>
                <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Let the school office route it</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} — {s.role}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-navy-400">Not sure? Leave this as-is and the office will route it to the right person.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
