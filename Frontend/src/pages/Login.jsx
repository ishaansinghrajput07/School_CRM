import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { notifySuccess, notifyError } from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import AuthHero from "../components/auth/AuthHero";
import AuthInput from "../components/ui/AuthInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      notifySuccess(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate(`/${user.role}`);
    } catch (err) {
      notifyError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F8F7F2] to-[#F3EFE6]">
      <AuthHero />

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#6B9B72]/[0.12] blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#A88B5B]/[0.10] blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Mobile-only logo (hero is hidden below lg) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7C5A] to-[#6B9B72] text-white shadow-md shadow-[#4F7C5A]/20">
              <GraduationCap size={22} />
            </div>
            <h1 className="font-display text-lg font-bold text-[#2F3A2F]">St. Thomas Convent Hr. Sec. School</h1>
            <p className="mt-1 text-sm text-[#1A1D18]">Indore · Sign in to your portal</p>
          </div>

          <div className="rounded-[24px] border border-[#E7E2D8] bg-white p-7 shadow-[0_20px_50px_-15px_rgba(47,58,47,0.12)] transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(79,124,90,0.15)] sm:p-8">
            <h2 className="font-display text-2xl font-bold text-[#2F3A2F]">Welcome back</h2>
            <p className="mt-1.5 text-sm text-[#1A1D18]">Sign in to continue to your student portal.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <AuthInput
                id="email"
                label="Email address"
                type="email"
                icon={Mail}
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <AuthInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                rightAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[#1A1D18] transition-colors hover:text-[#4F7C5A]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1D18]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E7E2D8] text-[#4F7C5A] accent-[#4F7C5A]"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-[#4F7C5A] transition-colors hover:text-[#3d6248]">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#4F7C5A] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#4F7C5A]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#456b4f] hover:shadow-lg hover:shadow-[#4F7C5A]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#E7E2D8]" />
              <span className="text-xs text-[#1A1D18]">or</span>
              <span className="h-px flex-1 bg-[#E7E2D8]" />
            </div>

            <p className="text-center text-sm text-[#1A1D18]">
              New student?{" "}
              <Link to="/signup" className="font-semibold text-[#4F7C5A] transition-colors hover:text-[#3d6248]">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
