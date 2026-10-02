import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import { Percent, UserCheck, UserX, ShieldCheck, ShieldAlert } from "lucide-react";

const DEFAULT_SUMMARY = {
  percentage: 0,
  present: 0,
  absent: 0,
  weekly: { percentage: 0, total: 0 },
  monthly: { percentage: 0, total: 0 },
  yearly: { percentage: 0, total: 0 },
  examEligibility: { requiredPercent: 75, eligible: true, shortfall: 0 },
};

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);

  useEffect(() => {
    const studentId = user?.student?._id;
    if (!studentId) return;
    attendanceApi.list({ student: studentId }).then(({ data }) => setRecords(data.records));
    attendanceApi.summary(studentId).then(({ data }) => setSummary(data));
  }, [user]);

  const { examEligibility } = summary;

  return (
    <div>
      <PageHeader title="My Attendance" description="Your day-by-day attendance record" />

      <div className="mb-4 grid grid-cols-3 gap-4">
        <StatCard label="Attendance %" value={summary.percentage} suffix="%" icon={Percent} accent="teal" />
        <StatCard label="Present" value={summary.present} icon={UserCheck} accent="teal" />
        <StatCard label="Absent" value={summary.absent} icon={UserX} accent="amber" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "This week", data: summary.weekly },
          { label: "This month", data: summary.monthly },
          { label: "This academic year", data: summary.yearly },
        ].map(({ label, data }) => (
          <div key={label} className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-900">{data.percentage}%</p>
            <p className="text-xs text-navy-400">{data.total} day{data.total === 1 ? "" : "s"} recorded</p>
          </div>
        ))}
      </div>

      <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
        examEligibility.eligible ? "border-teal-200 bg-teal-50" : "border-red-200 bg-red-50"
      }`}>
        {examEligibility.eligible ? (
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-teal-600" />
        ) : (
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-red-500" />
        )}
        <div>
          <p className={`text-sm font-semibold ${examEligibility.eligible ? "text-teal-700" : "text-red-700"}`}>
            {examEligibility.eligible ? "You meet the exam attendance requirement" : "You're below the exam attendance requirement"}
          </p>
          <p className="text-xs text-navy-500">
            Your class requires at least {examEligibility.requiredPercent}% attendance to sit exams.
            {!examEligibility.eligible && ` You need ${examEligibility.shortfall}% more to become eligible.`}
          </p>
        </div>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="border-b border-navy-50 last:border-0">
                <td className="px-5 py-3 text-navy-600">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-5 py-3"><Badge status={r.status} /></td>
                <td className="px-5 py-3 text-navy-500">{r.remarks || "-"}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-navy-400">No attendance records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
