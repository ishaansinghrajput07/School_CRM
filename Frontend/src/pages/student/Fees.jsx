import { useEffect, useState } from "react";
import { feesApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

export default function StudentFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);

  useEffect(() => {
    if (user?.student?._id) {
      feesApi.list({ student: user.student._id }).then(({ data }) => setFees(data.fees));
    }
  }, [user]);

  return (
    <div>
      <PageHeader title="My Fees" description="View fee status and payment history" />
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Fee Type</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Paid</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-medium text-navy-900">{f.feeType}</td>
                <td className="px-5 py-3 text-navy-600">₹{f.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">₹{f.amountPaid.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">{new Date(f.dueDate).toLocaleDateString()}</td>
                <td className="px-5 py-3"><Badge status={f.status} /></td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">No fee records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
