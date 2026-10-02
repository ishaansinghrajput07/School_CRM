import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { feesApi, feeStructuresApi, studentsApi, classesApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const TABS = ["Student Fees", "Fee Structures (by Class)"];

export default function Fees() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <PageHeader
        title="Fee Management"
        description="Define fees per class once - they auto-apply to every student in it, now and on promotion"
      />

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-navy-50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-white text-navy-900 shadow-card" : "text-navy-500 hover:text-navy-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === TABS[0] ? <StudentFees /> : <FeeStructures />}
    </div>
  );
}

function StudentFees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ student: "", feeType: "Tuition", amount: "", dueDate: "" });

  const load = () => feesApi.list().then(({ data }) => setFees(data.fees));

  useEffect(() => {
    load();
    studentsApi.list({ limit: 200 }).then(({ data }) => setStudents(data.students));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await feesApi.create(form);
      toast.success("Fee record created");
      setModalOpen(false);
      setForm({ student: "", feeType: "Tuition", amount: "", dueDate: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create fee");
    }
  };

  const handlePay = async (fee) => {
    const amount = prompt(`Record payment amount for ${fee.student?.firstName} (balance ₹${fee.amount + fee.fine - fee.amountPaid}):`);
    if (!amount) return;
    try {
      await feesApi.pay(fee._id, { amount: Number(amount), method: "cash" });
      toast.success("Payment recorded");
      load();
    } catch (err) {
      toast.error("Payment failed");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> One-off Fee</button>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Fee Type</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Paid</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="stagger-rows">
            {fees.map((f, i) => (
              <tr key={f._id} style={{ "--i": i }} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-medium text-navy-900">{f.student?.firstName} {f.student?.lastName}</td>
                <td className="px-5 py-3 text-navy-600">{f.feeType}</td>
                <td className="px-5 py-3 text-navy-600">₹{f.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">₹{f.amountPaid.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">{new Date(f.dueDate).toLocaleDateString()}</td>
                <td className="px-5 py-3"><Badge status={f.status} /></td>
                <td className="px-5 py-3 text-right">
                  {f.status !== "paid" && (
                    <button onClick={() => handlePay(f)} className="text-xs font-semibold text-teal-600 hover:underline">
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-navy-400">No fee records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New One-off Fee</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select required className="input" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fee Type</label>
                <input required className="input" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} />
              </div>
              <div>
                <label className="label">Amount</label>
                <input required type="number" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input required type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeStructures() {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ class: "", feeType: "Tuition", amount: "", dueDate: "", academicYear: "" });

  const load = () => feeStructuresApi.list().then(({ data }) => setStructures(data.feeStructures));

  useEffect(() => {
    load();
    classesApi.list().then(({ data }) => setClasses(data.classes));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await feeStructuresApi.create(form);
      toast.success(
        data.appliedToExisting > 0
          ? `Fee structure created - applied to ${data.appliedToExisting} existing student(s) immediately`
          : "Fee structure created - no students in this class yet, applies as they enroll"
      );
      setModalOpen(false);
      setForm({ class: "", feeType: "Tuition", amount: "", dueDate: "", academicYear: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create fee structure");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this fee structure? Already-created student fee records are unaffected.")) return;
    await feeStructuresApi.remove(id);
    load();
  };

  return (
    <div>
      <p className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">
        Define a fee once per class here. It's applied automatically to every student already in that class,
        every new signup into it, and every student promoted into it later.
      </p>

      <div className="mb-4 flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Fee Structure</button>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Fee Type</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Academic Year</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="stagger-rows">
            {structures.map((s, i) => (
              <tr key={s._id} style={{ "--i": i }} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-medium text-navy-900">{s.class?.name}</td>
                <td className="px-5 py-3 text-navy-600">{s.feeType}</td>
                <td className="px-5 py-3 text-navy-600">₹{s.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">{new Date(s.dueDate).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-navy-600">{s.academicYear || "—"}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(s._id)} className="text-navy-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {structures.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-navy-400">No fee structures defined yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Fee Structure</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Class</label>
                <select required className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fee Type</label>
                <input required className="input" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} placeholder="Tuition" />
              </div>
              <div>
                <label className="label">Amount</label>
                <input required type="number" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input required type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Academic Year (optional)</label>
                <input className="input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2026-2027" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
