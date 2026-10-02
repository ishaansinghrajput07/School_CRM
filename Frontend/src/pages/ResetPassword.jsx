import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/endpoints";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "This link is invalid or has expired");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
            <GraduationCap size={26} />
          </div>
          <h1 className="font-display text-xl font-bold text-white">Set a new password</h1>
          <p className="mt-1 text-sm text-navy-300">St. Thomas Convent Hr. Sec. School, Indore</p>
        </div>

        <div className="rounded-xl border border-navy-700 bg-navy-800 p-6">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm text-navy-200">Password reset successfully. Taking you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="label !text-navy-200" htmlFor="password">New password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="input !border-navy-600 !bg-navy-900 !text-white placeholder:!text-navy-500 pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="label !text-navy-200" htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input !border-navy-600 !bg-navy-900 !text-white placeholder:!text-navy-500"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full !bg-teal-500 hover:!bg-teal-600">
                {submitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">
          <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
