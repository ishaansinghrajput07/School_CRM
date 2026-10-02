import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { trackingApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const STATUSES = ["pending", "processing", "approved", "rejected"];

export default function Tracking() {
  const [requests, setRequests] = useState([]);
  const load = () => trackingApi.list().then(({ data }) => setRequests(data.requests));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await trackingApi.updateStatus(id, { status });
    toast.success("Request updated");
    load();
  };

  return (
    <div>
      <PageHeader title="Request Tracking" description="Process certificate and document requests" />
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Request #</th>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-navy-500">{r.requestNumber}</td>
                <td className="px-5 py-3 font-medium text-navy-900">{r.student?.firstName} {r.student?.lastName}</td>
                <td className="px-5 py-3 capitalize text-navy-600">{r.type.replace(/_/g, " ")}</td>
                <td className="px-5 py-3"><Badge status={r.status} /></td>
                <td className="px-5 py-3 text-right">
                  <select value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)} className="input !w-auto !py-1.5 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">No requests submitted yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
