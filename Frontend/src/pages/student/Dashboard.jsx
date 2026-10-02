import { useEffect, useState } from "react";
import { Percent, Wallet, Megaphone, Ticket } from "lucide-react";
import { dashboardApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import MotivationalQuote from "../../components/shared/MotivationalQuote";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.student?._id) {
      dashboardApi
        .student(user.student._id)
        .then(({ data }) => setData(data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const cards = data?.cards || {};

  if (loading) {
    return (
      <div>
        <PageHeader title={`Welcome, ${user?.name?.split(" ")[0]}`} description="Here's a snapshot of your school activity" />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(" ")[0]}`} description="Here's a snapshot of your school activity" />

      <MotivationalQuote className="mb-6" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Attendance" value={cards.attendancePercentage ?? 0} suffix="%" icon={Percent} accent="teal" />
        <StatCard label="Pending Fees" value={`₹${(cards.pendingFees ?? 0).toLocaleString()}`} icon={Wallet} accent="amber" />
        <StatCard label="Open Tickets" value={cards.openTickets ?? 0} icon={Ticket} accent="navy" />
        <StatCard label="Notices" value={cards.latestNotice ? 1 : 0} icon={Megaphone} accent="navy" />
      </div>

      {cards.latestNotice && (
        <div className="card mt-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-400">Latest Notice</p>
          <h3 className="font-display font-semibold text-navy-900">{cards.latestNotice.title}</h3>
          <p className="mt-1 text-sm text-navy-600">{cards.latestNotice.content}</p>
        </div>
      )}
    </div>
  );
}
