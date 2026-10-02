import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { accountingApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

const INCOME_CATEGORIES = ["Student Fees", "Admission Fees", "Donations", "Other Income"];
const EXPENSE_CATEGORIES = ["Salary", "Electricity", "Water", "Internet", "Maintenance", "Stationery"];

export default function Accounting() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: "income", category: INCOME_CATEGORIES[0], amount: "", description: "" });

  const load = () => {
    accountingApi.list().then(({ data }) => setTransactions(data.transactions));
    accountingApi.summary().then(({ data }) => setSummary(data));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await accountingApi.create(form);
      toast.success("Transaction recorded");
      setModalOpen(false);
      setForm({ type: "income", category: INCOME_CATEGORIES[0], amount: "", description: "" });
      load();
    } catch (err) {
      toast.error("Failed to save transaction");
    }
  };

  return (
    <div>
      <PageHeader
        title="Accounting"
        description="Record and track school income and expenses"
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Transaction</button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Income" value={`₹${summary.totalIncome.toLocaleString()}`} icon={TrendingUp} accent="teal" />
        <StatCard label="Total Expense" value={`₹${summary.totalExpense.toLocaleString()}`} icon={TrendingDown} accent="amber" />
        <StatCard label="Net Balance" value={`₹${summary.netBalance.toLocaleString()}`} icon={Scale} accent="navy" />
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 text-navy-600">{new Date(t.date).toLocaleDateString()}</td>
                <td className={`px-5 py-3 font-semibold capitalize ${t.type === "income" ? "text-teal-600" : "text-amber-600"}`}>{t.type}</td>
                <td className="px-5 py-3 text-navy-600">{t.category}</td>
                <td className="px-5 py-3 text-navy-600">{t.description || "-"}</td>
                <td className="px-5 py-3 text-right font-medium text-navy-900">₹{t.amount.toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-400">No transactions recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Transaction</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] })}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input required type="number" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
