import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock } from "lucide-react";
import { salariesApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const monthLabel = (m) => {
  if (!m) return "—";
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export default function TeacherSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salariesApi.mine().then(({ data }) => setSalaries(data.salaries)).finally(() => setLoading(false));
  }, []);

  const latest = salaries[0];

  return (
    <div>
      <PageHeader title="My Salary" description="Your pay history, set by the school administration" />

      {loading && <p className="text-sm text-navy-400">Loading...</p>}

      {!loading && salaries.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No salary records yet. The admin sets these up from the Salaries module - check back after your first pay cycle.
        </p>
      )}

      {!loading && salaries.length > 0 && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Latest month</p>
              <p className="mt-1 font-display text-lg font-bold text-navy-900">{monthLabel(latest.month)}</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Net salary</p>
              <p className="mt-1 flex items-center gap-1 font-display text-lg font-bold text-navy-900">
                <Banknote size={18} className="text-teal-600" /> ₹{latest.netSalary}
              </p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Status</p>
              <p className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                latest.status === "paid" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
              }`}>
                {latest.status === "paid" ? <CheckCircle2 size={14} /> : <Clock size={14} />} {latest.status}
              </p>
            </div>
          </div>

          <div className="card !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Base</th>
                  <th className="px-5 py-3">Bonus</th>
                  <th className="px-5 py-3">Deduction</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Paid on</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s._id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-navy-900">{monthLabel(s.month)}</td>
                    <td className="px-5 py-3 text-navy-500">₹{s.baseSalary}</td>
                    <td className="px-5 py-3 text-teal-600">+₹{s.bonus}</td>
                    <td className="px-5 py-3 text-red-500">-₹{s.deduction}</td>
                    <td className="px-5 py-3 font-semibold text-navy-900">₹{s.netSalary}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        s.status === "paid" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-navy-400">{s.paymentDate ? new Date(s.paymentDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
