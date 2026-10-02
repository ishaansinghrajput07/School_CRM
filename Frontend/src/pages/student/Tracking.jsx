import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { trackingApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const TYPES = [
  { value: "bonafide_certificate", label: "Bonafide Certificate" },
  { value: "transfer_certificate", label: "Transfer Certificate" },
  { value: "admission_request", label: "Admission Request" },
  { value: "document_verification", label: "Document Verification" },
];

export default function StudentTracking() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: TYPES[0].value, details: "" });

  const load = () => {
    if (user?.student?._id) trackingApi.list({ student: user.student._id }).then(({ data }) => setRequests(data.requests));
  };
  useEffect(() => { load(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await trackingApi.create({ ...form, student: user.student._id });
      toast.success("Request submitted");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error("Failed to submit request");
    }
  };

  return (
    <div>
      <PageHeader
        title="Track Requests"
        description="Request certificates and documents"
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Request</button>}
      />

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Request #</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-navy-500">{r.requestNumber}</td>
                <td className="px-5 py-3 capitalize text-navy-600">{r.type.replace(/_/g, " ")}</td>
                <td className="px-5 py-3"><Badge status={r.status} /></td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-navy-400">No requests submitted yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Request</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Request Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Details (optional)</label>
                <textarea rows={3} className="input" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
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
