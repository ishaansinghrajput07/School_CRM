import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/endpoints";
import { getSocket } from "../../api/socket";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function TeacherTickets() {
  const { id } = useParams();
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");

  const load = () => ticketsApi.list().then(({ data }) => setTickets(data.tickets));
  useEffect(() => {
    load();
    if (id) openTicket(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast(`Ticket forwarded to you: ${ticket.subject}`, { icon: "🎫" });
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

  return (
    <div>
      <PageHeader title="My Tickets" description="Requests students have forwarded to you, plus any you've raised yourself" />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t._id}
                  onClick={() => openTicket(t._id)}
                  className={`cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/50 ${active?._id === t._id ? "bg-navy-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{t.subject}</p>
                    <p className="font-mono text-xs text-navy-400">{t.ticketNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-500">{t.raisedBy?.name}</td>
                  <td className="px-4 py-3"><Badge status={t.status} /></td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-navy-400">No tickets right now</td></tr>
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
                  <p className="text-xs text-navy-400">
                    {active.ticketNumber} · raised by {active.raisedBy?.name} · {active.category?.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge status={active.status} />
              </div>
              <p className="mb-4 rounded-lg bg-navy-50 p-3 text-sm text-navy-700">{active.description}</p>

              <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                {active.replies?.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-2.5 text-sm ${r.repliedBy?.role !== "student" ? "border-teal-100 bg-teal-50/50" : "border-navy-100"}`}>
                    <p className="text-xs font-semibold text-navy-500">{r.repliedBy?.name} ({r.repliedBy?.role})</p>
                    <p className="text-navy-700">{r.message}</p>
                  </div>
                ))}
                {(!active.replies || active.replies.length === 0) && <p className="text-center text-xs text-navy-300">No replies yet</p>}
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
