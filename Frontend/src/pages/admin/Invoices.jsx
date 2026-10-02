import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { invoicesApi, studentsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ student: "", totalAmount: "", dueDate: "", items: [{ description: "Tuition Fee", amount: "" }] });

  const load = () => invoicesApi.list().then(({ data }) => setInvoices(data.invoices));
  useEffect(() => {
    load();
    studentsApi.list({ limit: 200 }).then(({ data }) => setStudents(data.students));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await invoicesApi.create(form);
      toast.success("Invoice generated");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    }
  };

  const toggleStatus = async (inv) => {
    await invoicesApi.updateStatus(inv._id, inv.status === "paid" ? "pending" : "paid");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Invoice Management"
        description="Generate and track student invoices"
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Invoice</button>}
      />

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-navy-500">{inv.invoiceNumber}</td>
                <td className="px-5 py-3 font-medium text-navy-900">{inv.student?.firstName} {inv.student?.lastName}</td>
                <td className="px-5 py-3 text-navy-600">₹{inv.totalAmount.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-5 py-3"><Badge status={inv.status} /></td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => toggleStatus(inv)} className="text-xs font-semibold text-teal-600 hover:underline">
                    Mark {inv.status === "paid" ? "Pending" : "Paid"}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-navy-400">No invoices generated yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Invoice</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select required className="input" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Total Amount</label>
                <input required type="number" min="0" className="input" value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value, items: [{ description: "Tuition Fee", amount: e.target.value }] })} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input required type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
