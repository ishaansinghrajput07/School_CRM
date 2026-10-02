import { useEffect, useState } from "react";
import { Plus, UserPlus, Copy, CheckCircle2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { salariesApi, staffApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

const DESIGNATIONS = ["principal", "teacher", "accountant", "receptionist", "office_staff"];
const EMPTY_STAFF = { name: "", email: "", designation: "teacher", phone: "", dateOfJoining: "" };
const EMPTY_SALARY = { employee: "", month: "", baseSalary: "", bonus: 0, deduction: 0 };

export default function Salaries() {
  const [salaries, setSalaries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF);
  const [salaryForm, setSalaryForm] = useState(EMPTY_SALARY);
  const [credentials, setCredentials] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const load = () => {
    salariesApi.list().then(({ data }) => setSalaries(data.salaries));
    staffApi.list().then(({ data }) => setStaff(data.staff));
  };
  useEffect(() => { load(); }, []);

  const openEditStaff = (s) => {
    setEditingStaffId(s._id);
    setEditForm({
      name: s.name,
      designation: s.designation || "office_staff",
      phone: s.phone || "",
      dateOfJoining: s.dateOfJoining ? s.dateOfJoining.slice(0, 10) : "",
      isActive: s.isActive,
    });
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await staffApi.update(editingStaffId, editForm);
      toast.success("Staff member updated — portal access syncs automatically with designation");
      setEditingStaffId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update staff member");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const { data } = await staffApi.create(staffForm);
      toast.success("Staff member added");
      setStaffModalOpen(false);
      setStaffForm(EMPTY_STAFF);
      setCredentials({ ...data.credentials, name: staffForm.name });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff");
    }
  };

  const handleAddSalary = async (e) => {
    e.preventDefault();
    try {
      await salariesApi.create(salaryForm);
      toast.success("Salary record created");
      setSalaryModalOpen(false);
      setSalaryForm(EMPTY_SALARY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create salary record");
    }
  };

  const markPaid = async (id) => {
    await salariesApi.markPaid(id);
    toast.success("Salary marked as paid");
    load();
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.tempPassword}`);
    toast.success("Copied to clipboard");
  };

  return (
    <div>
      <PageHeader
        title="Salary Management"
        description="Manage staff, dates of joining, and monthly payroll"
        action={
          <div className="flex gap-2">
            <button onClick={() => setStaffModalOpen(true)} className="btn-secondary"><UserPlus size={16} /> Add Staff</button>
            <button onClick={() => setSalaryModalOpen(true)} className="btn-primary"><Plus size={16} /> New Salary Record</button>
          </div>
        }
      />

      <div className="mb-6 card !p-0 overflow-x-auto">
        <p className="border-b border-navy-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Staff Directory</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Designation</th>
              <th className="px-5 py-3">Portal Access</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Date of Joining</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-medium text-navy-900">{s.name}</td>
                <td className="px-5 py-3 capitalize text-navy-600">{(s.designation || "-").replace(/_/g, " ")}</td>
                <td className="px-5 py-3">
                  <span className={`badge ${s.role === "teacher" ? "bg-violet-50 text-violet-700" : "bg-navy-50 text-navy-600"}`}>
                    {s.role === "teacher" ? "Teacher Portal" : "Admin Portal"}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy-600">{s.email}</td>
                <td className="px-5 py-3 text-navy-600">{s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString() : "-"}</td>
                <td className="px-5 py-3">
                  <span className={`badge ${s.isActive ? "bg-teal-50 text-teal-700" : "bg-navy-100 text-navy-500"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openEditStaff(s)} className="text-navy-300 hover:text-navy-600">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-navy-400">No staff added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <p className="border-b border-navy-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Payroll</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Month</th>
              <th className="px-5 py-3">Base</th>
              <th className="px-5 py-3">Bonus</th>
              <th className="px-5 py-3">Deduction</th>
              <th className="px-5 py-3">Net</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 font-medium text-navy-900">{s.employee?.name}</td>
                <td className="px-5 py-3 text-navy-600">{s.month}</td>
                <td className="px-5 py-3 text-navy-600">₹{s.baseSalary.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">₹{s.bonus.toLocaleString()}</td>
                <td className="px-5 py-3 text-navy-600">₹{s.deduction.toLocaleString()}</td>
                <td className="px-5 py-3 font-semibold text-navy-900">₹{s.netSalary?.toLocaleString()}</td>
                <td className="px-5 py-3"><Badge status={s.status} /></td>
                <td className="px-5 py-3 text-right">
                  {s.status !== "paid" && (
                    <button onClick={() => markPaid(s._id)} className="text-xs font-semibold text-teal-600 hover:underline">Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-navy-400">No salary records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">Add Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input required className="input" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input required type="email" className="input" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Designation</label>
                  <select className="input" value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date of Joining</label>
                  <input required type="date" className="input" value={staffForm.dateOfJoining} onChange={(e) => setStaffForm({ ...staffForm, dateOfJoining: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStaffModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStaffId && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-1 font-display text-lg font-bold text-navy-900">Edit Staff Member</h3>
            <p className="mb-4 text-xs text-navy-400">Changing designation to/from "teacher" automatically switches their portal access.</p>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input required className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Designation</label>
                  <select className="input" value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date of Joining</label>
                  <input type="date" className="input" value={editForm.dateOfJoining} onChange={(e) => setEditForm({ ...editForm, dateOfJoining: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-navy-600">
                <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                Active (can log in)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingStaffId(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {salaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-navy-900">New Salary Record</h3>
            <form onSubmit={handleAddSalary} className="space-y-4">
              <div>
                <label className="label">Employee</label>
                <select required className="input" value={salaryForm.employee} onChange={(e) => setSalaryForm({ ...salaryForm, employee: e.target.value })}>
                  <option value="">Select employee</option>
                  {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <input required type="month" className="input" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Base</label>
                  <input required type="number" min="0" className="input" value={salaryForm.baseSalary} onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })} />
                </div>
                <div>
                  <label className="label">Bonus</label>
                  <input type="number" min="0" className="input" value={salaryForm.bonus} onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })} />
                </div>
                <div>
                  <label className="label">Deduction</label>
                  <input type="number" min="0" className="input" value={salaryForm.deduction} onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSalaryModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-teal-500" size={36} />
            <h3 className="font-display text-lg font-bold text-navy-900">Staff Login Created</h3>
            <p className="mt-1 text-sm text-navy-500">Share these one-time credentials with {credentials.name}.</p>
            <div className="mt-4 space-y-2 rounded-lg bg-navy-50 p-3 text-left text-sm">
              <p><span className="text-navy-400">Email:</span> <span className="font-mono text-navy-800">{credentials.email}</span></p>
              <p><span className="text-navy-400">Password:</span> <span className="font-mono text-navy-800">{credentials.tempPassword}</span></p>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={copyCredentials} className="btn-secondary"><Copy size={14} /> Copy</button>
              <button onClick={() => setCredentials(null)} className="btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
