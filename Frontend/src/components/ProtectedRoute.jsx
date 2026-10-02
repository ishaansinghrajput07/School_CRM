import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppBootLoader } from "./ui/Skeleton";

// Wraps admin/student routes: bounces unauthenticated users to /login and
// blocks cross-role access (a student can't reach /admin/* and vice versa)
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppBootLoader />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  return children;
}
