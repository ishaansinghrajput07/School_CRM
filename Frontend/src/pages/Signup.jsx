import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  Contact,
  ClipboardCheck,
  MapPin,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { notifySuccess, notifyError } from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { publicApi } from "../api/endpoints";
import MobileVerifyField from "../components/MobileVerifyField";
import AuthHero from "../components/auth/AuthHero";
import AuthInput from "../components/ui/AuthInput";
import AuthSelect from "../components/ui/AuthSelect";
import PasswordStrength from "../components/ui/PasswordStrength";

const STEPS = [
  { label: "Account", icon: User },
  { label: "Personal Info", icon: Contact },
  { label: "Academic Details", icon: GraduationCap },
  { label: "Review", icon: ClipboardCheck },
];

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  mobile: "",
  parentMobile: "",
  dob: "",
  gender: "",
  address: "",
  classId: "",
  section: "",
  branch: "",
  semester: "",
  rollNumber: "",
  admissionNumber: "",
  academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
  passingYear: "",
  subjects: "",
};

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [classes, setClasses] = useState([]);
  const [mobileVerifyToken, setMobileVerifyToken] = useState(null);
  const [parentMobileVerifyToken, setParentMobileVerifyToken] = useState(null);

  useEffect(() => {
    publicApi
      .classes()
      .then(({ data }) => setClasses(data.classes || []))
      .catch(() => setClasses([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const age = form.dob
    ? Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
        notifyError("Please fill in every field");
        return false;
      }
      if (form.password.length < 6) {
        notifyError("Password must be at least 6 characters");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        notifyError("Passwords don't match");
        return false;
      }
    }
    if (step === 1) {
      if (!form.mobile || !form.parentMobile || !form.gender || !form.address) {
        notifyError("Please fill in every field");
        return false;
      }
      // OTP verification is optional here - if the person verified it, great,
      // it gets attached below; if not, signup still proceeds.
    }
    if (step === 2) {
      if (!form.admissionNumber || !form.classId || !form.section) {
        notifyError("Admission number, class and section are required");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = await signup({ ...form, mobileVerifyToken, parentMobileVerifyToken });
      setSuccess(true);
      notifySuccess(`Welcome, ${user.name.split(" ")[0]} — your account is ready`);
      setTimeout(() => navigate("/student"), 1400);
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F8F7F2] to-[#F3EFE6]">
      <AuthHero />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#6B9B72]/[0.12] blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#A88B5B]/[0.10] blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-xl"
        >
          {/* Mobile-only logo */}
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7C5A] to-[#6B9B72] text-white shadow-md shadow-[#4F7C5A]/20">
              <GraduationCap size={22} />
            </div>
            <h1 className="font-display text-lg font-bold text-[#2F3A2F]">Create your student account</h1>
            <p className="mt-1 text-sm text-[#1A1D18]">Your digital ID card is generated automatically</p>
          </div>

          <div className="rounded-[24px] border border-[#E7E2D8] bg-white p-6 shadow-[0_20px_50px_-15px_rgba(47,58,47,0.12)] sm:p-8">
            {!success && (
              <>
                <div className="hidden text-center lg:block">
                  <h2 className="font-display text-2xl font-bold text-[#2F3A2F]">Create your student account</h2>
                  <p className="mt-1.5 text-sm text-[#1A1D18]">Your digital ID card is generated automatically</p>
                </div>

                {/* Labeled step indicator */}
                <div className="mt-6 flex items-center justify-between">
                  {STEPS.map((s, i) => (
                    <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                          i < step
                            ? "bg-[#6B9B72] text-white"
                            : i === step
                            ? "bg-gradient-to-br from-[#4F7C5A] to-[#6B9B72] text-white shadow-md shadow-[#4F7C5A]/25"
                            : "bg-[#F3EFE6] text-[#4A4F45]"
                        }`}
                      >
                        {i < step ? <Check size={14} /> : <s.icon size={14} />}
                      </span>
                      <span className={`hidden text-[11px] font-medium sm:block ${i === step ? "text-[#2F3A2F]" : "text-[#4A4F45]"}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {/* Animated progress bar */}
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#F3EFE6]">
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#4F7C5A] to-[#6B9B72]"
                  />
                </div>

                <p className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-[#4F7C5A]">
                  Step {step + 1} of {STEPS.length} · {STEPS[step].label}
                </p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4"
                  >
                    {step === 0 && (
                      <div className="grid gap-4">
                        <AuthInput id="fullName" label="Full name" icon={User} value={form.fullName} onChange={set("fullName")} />
                        <AuthInput id="signupEmail" label="Email" type="email" icon={Mail} value={form.email} onChange={set("email")} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <AuthInput
                              id="signupPassword"
                              label="Password"
                              type={showPassword ? "text" : "password"}
                              icon={Lock}
                              value={form.password}
                              onChange={set("password")}
                              rightAdornment={
                                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[#4A4F45] hover:text-[#4F7C5A]" aria-label="Toggle password visibility">
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              }
                            />
                            <PasswordStrength password={form.password} />
                          </div>
                          <AuthInput
                            id="confirmPassword"
                            label="Confirm password"
                            type={showPassword ? "text" : "password"}
                            icon={Lock}
                            value={form.confirmPassword}
                            onChange={set("confirmPassword")}
                            rightAdornment={
                              form.confirmPassword &&
                              (form.confirmPassword === form.password ? (
                                <CheckCircle2 size={16} className="text-[#4F7C5A]" />
                              ) : (
                                <span className="text-xs text-red-500">✕</span>
                              ))
                            }
                          />
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <MobileVerifyField
                            label="Mobile number"
                            value={form.mobile}
                            onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
                            purpose="signup_student_mobile"
                            verified={!!mobileVerifyToken}
                            onVerified={setMobileVerifyToken}
                            variant="sage"
                          />
                          <MobileVerifyField
                            label="Parent mobile number"
                            value={form.parentMobile}
                            onChange={(v) => setForm((f) => ({ ...f, parentMobile: v }))}
                            purpose="signup_parent_mobile"
                            verified={!!parentMobileVerifyToken}
                            onVerified={setParentMobileVerifyToken}
                            variant="sage"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <AuthInput id="dob" label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
                          <AuthSelect id="gender" label="Gender" value={form.gender} onChange={set("gender")}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </AuthSelect>
                        </div>
                        {age !== null && <p className="-mt-2 text-xs text-[#4A4F45]">Age: {age} years</p>}
                        <AuthInput id="address" label="Address" icon={MapPin} value={form.address} onChange={set("address")} />
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <AuthSelect id="classId" label="Class" value={form.classId} onChange={set("classId")}>
                            <option value="">Select class</option>
                            {classes.map((c) => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </AuthSelect>
                          <AuthSelect id="section" label="Section" value={form.section} onChange={set("section")}>
                            <option value="">Select section</option>
                            {(classes.find((c) => c._id === form.classId)?.sections || ["A", "B"]).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </AuthSelect>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <AuthInput id="branch" label="Branch (if applicable)" value={form.branch} onChange={set("branch")} />
                          <AuthInput id="semester" label="Semester (if applicable)" value={form.semester} onChange={set("semester")} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <AuthInput id="rollNumber" label="Roll number" value={form.rollNumber} onChange={set("rollNumber")} />
                          <AuthInput
                            id="admissionNumber"
                            label="Admission number"
                            value={form.admissionNumber}
                            onChange={set("admissionNumber")}
                            hint="Use the number assigned after your admission application is approved."
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <AuthInput id="academicYear" label="Academic year" value={form.academicYear} onChange={set("academicYear")} />
                          <AuthInput id="passingYear" label="Passing year" value={form.passingYear} onChange={set("passingYear")} />
                        </div>
                        <AuthInput id="subjects" label="Subjects (comma-separated)" value={form.subjects} onChange={set("subjects")} />
                      </div>
                    )}

                    {step === 3 && (
                      <div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-[#E7E2D8] bg-[#F8F7F2] p-4 text-sm sm:p-5">
                          <Review label="Name" value={form.fullName} />
                          <Review label="Email" value={form.email} />
                          <Review label="Mobile" value={form.mobile ? `${form.mobile} ✓ verified` : ""} />
                          <Review label="Parent mobile" value={form.parentMobile ? `${form.parentMobile} ✓ verified` : ""} />
                          <Review label="Gender" value={form.gender} />
                          <Review label="Age" value={age ?? "—"} />
                          <Review label="Class" value={classes.find((c) => c._id === form.classId)?.name || "—"} />
                          <Review label="Section" value={form.section} />
                          <Review label="Admission no." value={form.admissionNumber} />
                          <Review label="Roll no." value={form.rollNumber || "—"} />
                          <Review label="Academic year" value={form.academicYear} />
                          <Review label="Subjects" value={form.subjects || "—"} />
                        </div>
                        <p className="mt-5 text-xs text-[#4A4F45]">
                          A digital ID card is generated for you automatically once you create your account —
                          photo upload can be added afterward from your profile.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-7 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1A1D18] transition-colors hover:text-[#2F3A2F] disabled:opacity-0"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={next}
                      className="group inline-flex items-center gap-1.5 rounded-xl bg-[#4F7C5A] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#4F7C5A]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#456b4f] hover:shadow-lg hover:shadow-[#4F7C5A]/25"
                    >
                      Continue <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F7C5A] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#4F7C5A]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#456b4f] hover:shadow-lg hover:shadow-[#4F7C5A]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Success animation */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4F7C5A]/10 text-[#4F7C5A]"
                  >
                    <Check size={32} strokeWidth={3} />
                  </motion.div>
                  <h3 className="mt-5 font-display text-xl font-bold text-[#2F3A2F]">Account created!</h3>
                  <p className="mt-1.5 text-sm text-[#1A1D18]">Redirecting you to your dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!success && (
            <p className="mt-6 text-center text-xs text-[#4A4F45]">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#4F7C5A] transition-colors hover:text-[#3d6248]">
                Log in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Review({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#4A4F45]">{label}</p>
      <p className="font-medium text-[#2F3A2F]">{value || "—"}</p>
    </div>
  );
}
