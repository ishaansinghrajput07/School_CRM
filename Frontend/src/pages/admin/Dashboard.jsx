import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  Wallet,
  TrendingUp,
  TrendingDown,
  Ticket,
  Megaphone,
  UserPlus,
  ClipboardCheck,
  FolderCheck,
  UserPlus2,
  CalendarCheck,
  Receipt,
  ClipboardList,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { dashboardApi, noticesApi, ticketsApi, examsApi, studentsApi, trackingApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import KpiCard from "../../components/ui/KpiCard";
import ListWidget from "../../components/ui/ListWidget";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { DashboardSkeleton } from "../../components/ui/Skeleton";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

// Month-over-month % change from two consecutive points in a chart series.
// Returns null (not 0) when there isn't enough history yet, so callers can
// tell "no change" apart from "no data to compare" and skip the trend badge
// entirely rather than showing a fake 0%.
function momDelta(series, key) {
  if (!series || series.length < 2) return null;
  const prev = series[series.length - 2]?.[key];
  const curr = series[series.length - 1]?.[key];
  if (!prev) return curr ? 100 : null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

const QUICK_ACTIONS = [
  { label: "Add Student", icon: UserPlus2, to: "/admin/students", accent: "navy" },
  { label: "Take Attendance", icon: CalendarCheck, to: "/admin/attendance", accent: "teal" },
  { label: "Create Notice", icon: Megaphone, to: "/admin/notices", accent: "violet" },
  { label: "Collect Fees", icon: Receipt, to: "/admin/fees", accent: "amber" },
];

const QUICK_ACTION_STYLES = {
  navy: "from-navy-500 to-navy-600",
  teal: "from-teal-500 to-teal-600",
  violet: "from-violet-500 to-violet-600",
  amber: "from-amber-500 to-amber-600",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notices, setNotices] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [exams, setExams] = useState(null);
  const [admissions, setAdmissions] = useState(null);
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    dashboardApi
      .admin()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));

    // Each widget fetches and renders independently - one slow/failing
    // endpoint shouldn't block the rest of the dashboard from appearing.
    noticesApi.list({ activeOnly: "true" }).then(({ data }) => setNotices(data.notices)).catch(() => setNotices([]));
    ticketsApi.list({ status: "open" }).then(({ data }) => setTickets(data.tickets)).catch(() => setTickets([]));
    examsApi.list({ upcoming: "true" }).then(({ data }) => setExams(data.exams)).catch(() => setExams([]));
    studentsApi.list({ limit: 5 }).then(({ data }) => setAdmissions(data.students)).catch(() => setAdmissions([]));
    trackingApi.list({ status: "pending" }).then(({ data }) => setRequests(data.requests)).catch(() => setRequests([]));
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const cards = data?.cards || {};

  // Reshape aggregation output into recharts-friendly rows
  const attendanceChart = (data?.charts?.monthlyAttendance || []).map((m) => ({
    month: m._id,
    percentage: m.total ? Math.round((m.present / m.total) * 1000) / 10 : 0,
  }));

  const incomeExpenseMap = {};
  (data?.charts?.monthlyIncomeExpense || []).forEach((row) => {
    const month = row._id.month;
    incomeExpenseMap[month] = incomeExpenseMap[month] || { month, income: 0, expense: 0 };
    incomeExpenseMap[month][row._id.type] = row.total;
  });
  const incomeExpenseChart = Object.values(incomeExpenseMap);

  const studentGrowthChart = (data?.charts?.studentGrowth || []).map((m) => ({ month: m._id, admissions: m.count }));

  const attendanceTrend = momDelta(attendanceChart, "percentage");
  const incomeTrend = momDelta(incomeExpenseChart, "income");
  const expenseTrend = momDelta(incomeExpenseChart, "expense");
  const admissionsTrend = momDelta(studentGrowthChart, "admissions");

  const pendingFees = cards.pendingFees ?? 0;
  const monthlyIncome = cards.monthlyIncome ?? 0;
  const feeCollectionRate = monthlyIncome + pendingFees > 0 ? Math.round((monthlyIncome / (monthlyIncome + pendingFees)) * 100) : 0;

  return (
    <div className="pb-16 lg:pb-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-navy-400">{today}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-navy-900 sm:text-3xl">
            {greeting()}, {user?.name || "Admin"} 👋
          </h1>
          <p className="mt-1 text-sm text-navy-400">Here's what's happening across the school today.</p>
        </div>

        {/* Quick actions - desktop row */}
        <div className="hidden gap-3 lg:flex">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to, accent }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${QUICK_ACTION_STYLES[accent]}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total Students" value={cards.totalStudents ?? 0} icon={Users} accent="navy" />
        <KpiCard index={1} label="Present Today" value={cards.presentStudents ?? 0} icon={UserCheck} accent="teal" />
        <KpiCard index={2} label="Absent Today" value={cards.absentStudents ?? 0} icon={UserX} accent="red" />
        <KpiCard index={3} label="Attendance" value={cards.attendancePercentage ?? 0} suffix="%" icon={Percent} accent="teal" trend={attendanceTrend} />
        <KpiCard index={4} label="New Admissions" value={cards.newAdmissions ?? 0} icon={UserPlus} accent="violet" trend={admissionsTrend} />
        <KpiCard index={5} label="Pending Fees" value={`₹${pendingFees.toLocaleString("en-IN")}`} icon={Wallet} accent="amber" />
        <KpiCard index={6} label="Monthly Income" value={`₹${monthlyIncome.toLocaleString("en-IN")}`} icon={TrendingUp} accent="teal" trend={incomeTrend} />
        <KpiCard index={7} label="Monthly Expenses" value={`₹${(cards.monthlyExpenses ?? 0).toLocaleString("en-IN")}`} icon={TrendingDown} accent="red" trend={expenseTrend} />
        <KpiCard index={8} label="Open Tickets" value={cards.openTickets ?? 0} icon={Ticket} accent="navy" />
        <KpiCard index={9} label="Active Notices" value={cards.activeNotices ?? 0} icon={Megaphone} accent="violet" />
        <KpiCard index={10} label="Assignment Completion" value={cards.assignmentCompletion ?? 0} suffix="%" icon={ClipboardCheck} accent="teal" />
        <KpiCard index={11} label="Project Completion" value={cards.projectCompletion ?? 0} suffix="%" icon={FolderCheck} accent="teal" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-4 font-display text-sm font-semibold text-navy-800">Monthly Attendance %</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#4a6f96" }} />
              <YAxis tick={{ fontSize: 12, fill: "#4a6f96" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef2f6", fontSize: 13 }} />
              <Line type="monotone" dataKey="percentage" stroke="#2C7A7B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-4 font-display text-sm font-semibold text-navy-800">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incomeExpenseChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#4a6f96" }} />
              <YAxis tick={{ fontSize: 12, fill: "#4a6f96" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef2f6", fontSize: 13 }} />
              <Legend />
              <Bar dataKey="income" fill="#2C7A7B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#E8A33D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="mb-4 font-display text-sm font-semibold text-navy-800">Student Growth (New Admissions)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={studentGrowthChart}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#4a6f96" }} />
              <YAxis tick={{ fontSize: 12, fill: "#4a6f96" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef2f6", fontSize: 13 }} />
              <Area type="monotone" dataKey="admissions" stroke="#6C5CE7" strokeWidth={2.5} fill="url(#growthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {(data?.charts?.branchAttendance?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 }} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 font-display text-sm font-semibold text-navy-800">Branch-wise Attendance %</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.charts.branchAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="branch" tick={{ fontSize: 12, fill: "#4a6f96" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#4a6f96" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef2f6", fontSize: 13 }} />
                <Bar dataKey="percentage" fill="#6C5CE7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Fee collection progress */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }} className="mt-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-navy-800">Fee Collection Progress (this month)</h3>
          <span className="font-display text-sm font-bold text-navy-900">{feeCollectionRate}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feeCollectionRate}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-navy-400">
          <span>Collected: ₹{monthlyIncome.toLocaleString("en-IN")}</span>
          <span>Pending: ₹{pendingFees.toLocaleString("en-IN")}</span>
        </div>
      </motion.div>

      {/* Recent activity widgets */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ListWidget title="Recent Notices" icon={Megaphone} loading={!notices} empty={notices?.length === 0} onViewAll={() => navigate("/admin/notices")} delay={0.05}>
          {notices?.slice(0, 5).map((n, i) => (
            <button
              key={n._id}
              style={{ "--i": i }}
              onClick={() => navigate("/admin/notices")}
              className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Megaphone size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">{n.title}</p>
                <p className="text-xs text-navy-400">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              </div>
            </button>
          ))}
        </ListWidget>

        <ListWidget title="Open Tickets" icon={Ticket} loading={!tickets} empty={tickets?.length === 0} emptyLabel="No open tickets - all clear" onViewAll={() => navigate("/admin/tickets")} delay={0.1}>
          {tickets?.slice(0, 5).map((t, i) => (
            <button
              key={t._id}
              style={{ "--i": i }}
              onClick={() => navigate("/admin/tickets")}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">{t.subject}</p>
                <p className="truncate text-xs text-navy-400">{t.raisedBy?.name || "Unknown"} · #{t.ticketNumber}</p>
              </div>
              <Badge status={t.status} />
            </button>
          ))}
        </ListWidget>

        <ListWidget title="Upcoming Exams" icon={ClipboardCheck} loading={!exams} empty={exams?.length === 0} onViewAll={() => navigate("/admin/exams")} delay={0.15}>
          {exams?.slice(0, 5).map((e, i) => (
            <button
              key={e._id}
              style={{ "--i": i }}
              onClick={() => navigate("/admin/exams")}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">{e.name}</p>
                <p className="truncate text-xs text-navy-400">{e.class?.name} · {e.subject?.name}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-navy-500">
                {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </button>
          ))}
        </ListWidget>

        <ListWidget title="Recent Admissions" icon={UserPlus} loading={!admissions} empty={admissions?.length === 0} onViewAll={() => navigate("/admin/students")} delay={0.2}>
          {admissions?.slice(0, 5).map((s, i) => (
            <button
              key={s._id}
              style={{ "--i": i }}
              onClick={() => navigate("/admin/students")}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50"
            >
              <Avatar name={`${s.firstName} ${s.lastName || ""}`} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">{s.firstName} {s.lastName}</p>
                <p className="truncate text-xs text-navy-400">{s.class?.name || "Unassigned"} · {s.admissionNumber}</p>
              </div>
            </button>
          ))}
        </ListWidget>

        <ListWidget title="Pending Requests" icon={ClipboardList} loading={!requests} empty={requests?.length === 0} emptyLabel="No pending requests" onViewAll={() => navigate("/admin/tracking")} delay={0.25}>
          {requests?.slice(0, 5).map((r, i) => (
            <button
              key={r._id}
              style={{ "--i": i }}
              onClick={() => navigate("/admin/tracking")}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-navy-800">{r.type?.replace(/_/g, " ")}</p>
                <p className="truncate text-xs text-navy-400">
                  {r.student?.firstName} {r.student?.lastName} · #{r.requestNumber}
                </p>
              </div>
              <Badge status={r.status} />
            </button>
          ))}
        </ListWidget>
      </div>

      {/* Mobile sticky quick-action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-navy-100 bg-white/95 p-3 backdrop-blur-sm lg:hidden">
        {QUICK_ACTIONS.map(({ label, icon: Icon, to, accent }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-br text-white shadow-sm ${QUICK_ACTION_STYLES[accent]}`}
          >
            <Icon size={16} />
            <span className="text-[10px] font-semibold leading-none">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
