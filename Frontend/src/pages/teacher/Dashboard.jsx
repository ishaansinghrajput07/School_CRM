import { ClipboardList, FolderKanban, Award, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Welcome, {user?.name?.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-navy-500">
        Attendance, assignments, projects and marks entry are all ready to use.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Live icon={CalendarCheck} title="Mark attendance" to="/teacher/attendance" />
        <Live icon={ClipboardList} title="Grade assignments" to="/teacher/assignments" />
        <Live icon={FolderKanban} title="Review projects" to="/teacher/projects" />
        <Live icon={Award} title="Enter marks" to="/teacher/marks" />
      </div>
    </div>
  );
}

function Live({ icon: Icon, title, to }) {
  return (
    <Link to={to} className="card flex flex-col items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 text-white">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-navy-900">{title}</p>
        <p className="text-xs text-teal-600">Open →</p>
      </div>
    </Link>
  );
}

function Coming({ icon: Icon, title }) {
  return (
    <div className="card flex flex-col items-start gap-3 opacity-60">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-navy-900">{title}</p>
        <p className="text-xs text-navy-400">Coming soon</p>
      </div>
    </div>
  );
}
