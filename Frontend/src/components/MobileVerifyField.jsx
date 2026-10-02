import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { otpApi } from "../api/endpoints";

/**
 * Inline "enter mobile -> send OTP -> enter code -> verified" widget.
 * Calls onVerified(token) once the code checks out; the parent form should
 * send that token along with signup so the backend can trust the number.
 */
export default function MobileVerifyField({ label, value, onChange, purpose, verified, onVerified, variant = "dark" }) {
  const light = variant === "light";
  const sage = variant === "sage";
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // If the number changes after being verified, drop the stale verification
  useEffect(() => {
    if (verified) onVerified(null);
    setOtpSent(false);
    setCode("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSend = async () => {
    if (!/^\+?[0-9]{7,15}$/.test(value)) {
      toast.error("Enter a valid mobile number first");
      return;
    }
    setSending(true);
    try {
      await otpApi.send(value, purpose);
      setOtpSent(true);
      setCooldown(30);
      toast.success("OTP sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    try {
      const { data } = await otpApi.verify(value, purpose, code);
      onVerified(data.verifyToken);
      toast.success(`${label} verified`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <label className={light ? "label" : sage ? "mb-1.5 block text-xs font-medium text-[#1A1D18]" : "mb-1.5 block text-xs font-medium text-slate-400"}>{label}</label>
      <div className="flex gap-2">
        <input
          className={
            light
              ? "input"
              : sage
              ? "w-full rounded-xl border border-[#E7E2D8] bg-[#F3EFE6]/60 px-4 py-3.5 text-sm text-[#2F3A2F] outline-none transition-all duration-200 placeholder:text-[#1A1D18] hover:border-[#4F7C5A]/30 focus:border-[#4F7C5A]/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,124,90,0.10)] disabled:opacity-60"
              : "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 hover:border-white/20 focus:border-teal-400/70 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(20,184,166,0.12)] disabled:opacity-60"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="98765 43210"
          disabled={verified}
        />
        {verified ? (
          <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold ${sage ? "bg-[#4F7C5A]/10 text-[#4F7C5A]" : "bg-teal-500/15 text-teal-600"}`}>
            <CheckCircle2 size={14} /> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || cooldown > 0 || !value}
            className={
              light
                ? "shrink-0 rounded-xl border border-navy-200 px-3 text-xs font-semibold text-navy-500 transition-colors hover:border-teal-500 hover:text-teal-600 disabled:opacity-40"
                : sage
                ? "shrink-0 rounded-xl border border-[#E7E2D8] px-3 text-xs font-semibold text-[#1A1D18] transition-colors hover:border-[#4F7C5A]/50 hover:text-[#4F7C5A] disabled:opacity-40"
                : "shrink-0 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/50 hover:text-teal-400 disabled:opacity-40"
            }
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        )}
      </div>

      {otpSent && !verified && (
        <div className="mt-2 flex gap-2">
          <input
            className={
              light
                ? "input"
                : sage
                ? "w-full rounded-xl border border-[#E7E2D8] bg-[#F3EFE6]/60 px-4 py-3.5 text-sm text-[#2F3A2F] outline-none transition-all duration-200 placeholder:text-[#1A1D18] hover:border-[#4F7C5A]/30 focus:border-[#4F7C5A]/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,124,90,0.10)]"
                : "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 hover:border-white/20 focus:border-teal-400/70 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(20,184,166,0.12)]"
            }
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
              sage ? "bg-[#4F7C5A] hover:bg-[#456b4f]" : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            <ShieldCheck size={14} /> {verifying ? "Checking..." : "Verify"}
          </button>
        </div>
      )}
    </div>
  );
}
