import { useEffect, useState } from "react";
import { Percent, Award, Bell, Users } from "lucide-react";
import { parentApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

const GRADE_TONE = {
  O: "text-teal-600", "A+": "text-teal-600", A: "text-violet-600",
  "B+": "text-navy-600", B: "text-amber-600", C: "text-amber-600", F: "text-red-600",
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi.children().then(({ data }) => {
      setChildren(data.children);
      if (data.children[0]) setActiveId(data.children[0]._id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    parentApi.overview(activeId).then(({ data }) => setOverview(data));
  }, [activeId]);

  if (loading) return <p className="text-sm text-navy-400">Loading...</p>;

  if (children.length === 0) {
    return (
      <div>
        <PageHeader title="Parent Portal" description={`Welcome, ${user?.name?.split(" ")[0]}`} />
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No student is linked to this account yet — ask the school admin to link your child.
        </p>
      </div>
    );
  }

  const active = children.find((c) => c._id === activeId);

  return (
    <div>
      <PageHeader title="Parent Portal" description="A read-only view of your child's attendance, results, and school notices" />

      {children.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                activeId === c._id ? "border-teal-400 bg-teal-50 text-teal-700" : "border-navy-100 text-navy-600 hover:bg-navy-50"
              }`}
            >
              <Users size={14} /> {c.firstName} {c.lastName}
            </button>
          ))}
        </div>
      )}

      {active && (
        <p className="mb-4 text-sm text-navy-500">
          Viewing <span className="font-semibold text-navy-800">{active.firstName} {active.lastName}</span> · {active.class?.name || "—"} {active.section ? `· Section ${active.section}` : ""}
        </p>
      )}

      {!overview ? (
        <p className="text-sm text-navy-400">Loading overview...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Attendance" value={overview.attendance.percentage} suffix="%" icon={Percent} accent="teal" />
            <StatCard label="Present / Total" value={`${overview.attendance.present}/${overview.attendance.total}`} icon={Users} accent="navy" />
            <StatCard label="CGPA" value={overview.result.cgpa?.toFixed(2) ?? "0.00"} icon={Award} accent="amber" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-navy-900">Results by semester</h3>
              {overview.result.semesters.length === 0 ? (
                <p className="text-sm text-navy-400">No results published yet.</p>
              ) : (
                <div className="space-y-4">
                  {overview.result.semesters.map((sem) => (
                    <div key={sem.semester} className="overflow-hidden rounded-xl border border-navy-100 bg-white">
                      <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50 px-4 py-2">
                        <p className="text-sm font-semibold text-navy-900">{sem.semester}</p>
                        <p className="text-sm text-navy-600">SGPA {sem.sgpa.toFixed(2)}</p>
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-navy-100">
                          {sem.subjects.map((s, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-navy-700">{s.subject?.name}</td>
                              <td className="px-4 py-2 text-navy-500">{s.total}/{s.maxTotal}</td>
                              <td className={`px-4 py-2 font-bold ${GRADE_TONE[s.grade] || "text-navy-600"}`}>{s.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-navy-900">
                <Bell size={15} /> Recent notices
              </h3>
              <div className="space-y-2.5">
                {overview.notices.length === 0 && <p className="text-sm text-navy-400">No notices yet.</p>}
                {overview.notices.map((n) => (
                  <div key={n._id} className="rounded-lg border border-navy-100 bg-white p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      <span className="badge bg-navy-50 text-navy-600 capitalize">{n.category}</span>
                    </div>
                    <p className="mt-1 text-xs text-navy-500">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
