import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, Mail, Phone, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { contactInquiriesApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

export default function ContactInquiries() {
  const [status, setStatus] = useState("pending");
  const [inquiries, setInquiries] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setInquiries(null);
    try {
      const { data } = await contactInquiriesApi.list({ status });
      setInquiries(data.inquiries);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't load contact messages");
      setInquiries([]);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (inquiry) => {
    setBusyId(inquiry._id);
    try {
      const nextStatus = inquiry.status === "pending" ? "resolved" : "pending";
      await contactInquiriesApi.update(inquiry._id, { status: nextStatus });
      setInquiries((current) => current.filter((item) => item._id !== inquiry._id));
      toast.success(nextStatus === "resolved" ? "Marked as resolved" : "Moved back to pending");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't update contact message");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (inquiry) => {
    if (!confirm("Delete this contact message permanently?")) return;
    setBusyId(inquiry._id);
    try {
      await contactInquiriesApi.remove(inquiry._id);
      setInquiries((current) => current.filter((item) => item._id !== inquiry._id));
      toast.success("Contact message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't delete contact message");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Contact Messages" description="Review and follow up on messages sent from the public contact form." />

      <div className="mb-5 flex gap-1 rounded-xl bg-navy-50 p-1">
        {[
          ["pending", "Pending"],
          ["resolved", "Resolved"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              status === key ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {inquiries === null ? (
        <p className="rounded-2xl border border-navy-100 bg-white p-8 text-center text-sm text-navy-400">Loading messages...</p>
      ) : inquiries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy-200 bg-white py-16 text-center text-sm text-navy-400">
          No {status} contact messages.
        </p>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <article key={inquiry._id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-navy-900">{inquiry.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-500">
                    <a className="inline-flex items-center gap-1.5 hover:text-navy-800" href={`mailto:${inquiry.email}`}>
                      <Mail size={14} /> {inquiry.email}
                    </a>
                    <a className="inline-flex items-center gap-1.5 hover:text-navy-800" href={`tel:${inquiry.phone}`}>
                      <Phone size={14} /> {inquiry.phone}
                    </a>
                  </div>
                </div>
                <time className="inline-flex items-center gap-1.5 text-xs text-navy-400" dateTime={inquiry.createdAt}>
                  <Clock3 size={13} />
                  {new Date(inquiry.createdAt).toLocaleString("en-IN")}
                </time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-navy-700">{inquiry.message}</p>
              <div className="mt-4 flex justify-end gap-2 border-t border-navy-50 pt-3">
                <button
                  type="button"
                  disabled={busyId === inquiry._id}
                  onClick={() => updateStatus(inquiry)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                >
                  <Check size={13} /> {status === "pending" ? "Mark resolved" : "Reopen"}
                </button>
                <button
                  type="button"
                  disabled={busyId === inquiry._id}
                  onClick={() => remove(inquiry)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
