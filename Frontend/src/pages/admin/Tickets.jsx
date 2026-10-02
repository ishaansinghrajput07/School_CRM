import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/endpoints";
import { getSocket } from "../../api/socket";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => ticketsApi.list(filterStatus ? { status: filterStatus } : {}).then(({ data }) => setTickets(data.tickets));

  useEffect(() => {
    load();
    ticketsApi.staffList().then(({ data }) => setStaff(data.staff));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // Live-refresh the list when a new ticket comes in or an existing one updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast(`New ticket: ${ticket.subject}`, { icon: "🎫" });
    };
    const onUpdated = (ticket) => {
      setTickets((prev) => prev.map((t) => (t._id === ticket._id ? ticket : t)));
      setActive((prev) => (prev && prev._id === ticket._id ? ticket : prev));
    };
    socket.on("ticket:new", onNew);
    socket.on("ticket:updated", onUpdated);
    return () => {
      socket.off("ticket:new", onNew);
      socket.off("ticket:updated", onUpdated);
    };
  }, []);

  const openTicket = async (id) => {
    const { data } = await ticketsApi.get(id);
    setActive(data.ticket);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await ticketsApi.reply(active._id, reply);
    setReply("");
    openTicket(active._id);
    load();
    toast.success("Reply sent");
  };

  const handleStatus = async (status) => {
    await ticketsApi.updateStatus(active._id, { status });
    openTicket(active._id);
    load();
  };

  const handlePriority = async (priority) => {
    await ticketsApi.updateStatus(active._id, { priority });
    openTicket(active._id);
    load();
  };

  const handleAssign = async (assignedTo) => {
    await ticketsApi.updateStatus(active._id, { assignedTo });
    openTicket(active._id);
    load();
    toast.success(assignedTo ? "Ticket assigned" : "Ticket unassigned");
  };

  const priorityColor = { low: "bg-navy-100 text-navy-500", medium: "bg-teal-50 text-teal-700", high: "bg-amber-50 text-amber-700", urgent: "bg-red-50 text-red-600" };

  return (
    <div>
      <PageHeader title="Ticket Management" description="Respond to and resolve student support requests" />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilterStatus("")} className={`badge ${filterStatus === "" ? "bg-navy-500 text-white" : "bg-navy-50 text-navy-500"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`badge capitalize ${filterStatus === s ? "bg-navy-500 text-white" : "bg-navy-50 text-navy-500"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} onClick={() => openTicket(t._id)}
                  className={`cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/50 ${active?._id === t._id ? "bg-navy-50" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-navy-500">{t.ticketNumber}</td>
                  <td className="px-4 py-3 font-medium text-navy-900">{t.subject}</td>
                  <td className="px-4 py-3"><span className={`badge capitalize ${priorityColor[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><Badge status={t.status} /></td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-navy-400">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          {!active ? (
            <p className="text-sm text-navy-400">Select a ticket to view details and reply.</p>
          ) : (
            <div>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-navy-900">{active.subject}</p>
                  <p className="text-xs text-navy-400">{active.ticketNumber} · raised by {active.raisedBy?.name} · {active.category?.replace(/_/g, " ")}</p>
                </div>
                <Badge status={active.status} />
              </div>
              <p className="mb-4 rounded-lg bg-navy-50 p-3 text-sm text-navy-700">{active.description}</p>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={active.priority} onChange={(e) => handlePriority(e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assign To</label>
                  <select className="input" value={active.assignedTo?._id || ""} onChange={(e) => handleAssign(e.target.value)}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                {active.replies?.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-2.5 text-sm ${r.repliedBy?.role === "admin" ? "border-teal-100 bg-teal-50/50" : "border-navy-100"}`}>
                    <p className="text-xs font-semibold text-navy-500">{r.repliedBy?.name} ({r.repliedBy?.role})</p>
                    <p className="text-navy-700">{r.message}</p>
                  </div>
                ))}
                {(!active.replies || active.replies.length === 0) && (
                  <p className="text-center text-xs text-navy-300">No replies yet</p>
                )}
              </div>

              <div className="mb-4 flex gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => handleStatus(s)}
                    className={`badge capitalize ${active.status === s ? "bg-navy-500 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>

              <form onSubmit={handleReply} className="flex gap-2">
                <input className="input" placeholder="Write a reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
                <button type="submit" className="btn-primary">Send</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
