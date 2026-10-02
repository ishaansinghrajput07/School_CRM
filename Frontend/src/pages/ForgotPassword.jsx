import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/endpoints";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
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
          <h1 className="font-display text-xl font-bold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-navy-300">St. Thomas Convent Hr. Sec. School, Indore</p>
        </div>

        <div className="rounded-xl border border-navy-700 bg-navy-800 p-6">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <Mail size={20} />
              </div>
              <p className="text-sm text-navy-200">
                If an account exists for <span className="font-semibold text-white">{email}</span>, we've sent a link to reset your password. It expires in 30 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-4 text-sm text-navy-300">
                Enter the email address on your account (student, teacher, or admin) and we'll send you a link to reset your password.
              </p>
              <div className="mb-5">
                <label className="label !text-navy-200" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input !border-navy-600 !bg-navy-900 !text-white placeholder:!text-navy-500"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full !bg-teal-500 hover:!bg-teal-600">
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-teal-400 hover:text-teal-300">
            <ArrowLeft size={12} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
