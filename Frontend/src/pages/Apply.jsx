import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, User, MapPin, School, MessageSquare, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { admissionsApi, publicApi } from "../api/endpoints";
import MobileVerifyField from "../components/MobileVerifyField";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

const emptyForm = {
  applicantName: "",
  dob: "",
  gender: "",
  applyingForClass: "",
  previousSchool: "",
  address: "",
  parentName: "",
  parentMobile: "",
  parentEmail: "",
  notes: "",
};

export default function Apply() {
  const [form, setForm] = useState(emptyForm);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesFailed, setClassesFailed] = useState(false);
  const [parentMobileVerifyToken, setParentMobileVerifyToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    publicApi
      .classes()
      .then(({ data }) => setClasses(data.classes || []))
      .catch((error) => {
        console.error("Failed to load admission classes:", error);
        setClassesFailed(true);
      })
      .finally(() => setClassesLoading(false));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicantName || !form.dob || !form.gender || !form.applyingForClass || !form.address || !form.parentName || !form.parentMobile) {
      toast.error("Please fill in every required field");
      return;
    }
    // Parent mobile verification is optional - attached below if completed,
    // but doesn't block submission if skipped.
    setSubmitting(true);
    try {
      const { data } = await admissionsApi.submit({ ...form, parentMobileVerifyToken });
      setSubmitted(true);
      toast.success(data.message || "Application submitted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Submission failed - please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-body">
      <Navbar />

      <section className="relative overflow-hidden bg-paper px-6 pb-24 pt-36">
        <GraduationCap size={420} strokeWidth={0.6} className="pointer-events-none absolute -right-24 -top-16 text-navy-900/[0.035]" aria-hidden />
        <div className="pointer-events-none absolute left-1/4 top-10 h-72 w-72 rounded-full bg-amber-300/15 blur-[110px]" aria-hidden />

        <div className="relative mx-auto max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="mt-5 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Admissions {new Date().getFullYear()}–{String(new Date().getFullYear() + 1).slice(2)}</span>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Apply for Admission</h1>
            <p className="mt-3 text-navy-500">
              Tell us a little about your child. Our admissions team will review your application and reach out to schedule next steps.
            </p>
          </div>

          <div className="premium-card mt-10 rounded-[28px] border-2 border-navy-900/10 bg-white p-7 sm:p-10">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <CheckCircle2 size={30} />
                  </motion.div>
                  <h2 className="mt-5 font-serif text-2xl font-semibold text-navy-900">Application submitted!</h2>
                  <p className="mt-2 max-w-sm text-sm text-navy-500">
                    Thank you for applying. Our admissions team will review your application and contact you at the mobile number you provided.
                  </p>
                  <Link to="/" className="mt-6 rounded-full bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                    Back to home
                  </Link>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-5">
                  <FieldGroup title="Child's details" icon={User}>
                    <div>
                      <label className="label">Full name</label>
                      <input required value={form.applicantName} onChange={set("applicantName")} className="input" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Date of birth</label>
                        <input required type="date" value={form.dob} onChange={set("dob")} className="input" />
                      </div>
                      <div>
                        <label className="label">Gender</label>
                        <select required value={form.gender} onChange={set("gender")} className="input">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Admission details" icon={School}>
                    <div>
                      <label className="label">Applying for class</label>
                      <select required disabled={classesLoading || classesFailed || classes.length === 0} value={form.applyingForClass} onChange={set("applyingForClass")} className="input">
                        <option value="">
                          {classesLoading ? "Loading classes..." : classesFailed ? "Unable to load classes" : classes.length === 0 ? "No classes available" : "Select class"}
                        </option>
                        {classes.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      {classesFailed && <p role="alert" className="mt-1 text-sm text-red-600">Classes could not be loaded. Please refresh the page or contact the school.</p>}
                      {!classesLoading && !classesFailed && classes.length === 0 && <p className="mt-1 text-sm text-navy-500">No classes are configured yet. Please contact the school.</p>}
                    </div>
                    <div>
                      <label className="label">Previous school (if any)</label>
                      <input value={form.previousSchool} onChange={set("previousSchool")} className="input" />
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Contact details" icon={MapPin}>
                    <div>
                      <label className="label">Parent/guardian name</label>
                      <input required value={form.parentName} onChange={set("parentName")} className="input" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MobileVerifyField
                        label="Parent mobile number"
                        value={form.parentMobile}
                        onChange={(v) => setForm((f) => ({ ...f, parentMobile: v }))}
                        purpose="admission_parent_mobile"
                        verified={!!parentMobileVerifyToken}
                        onVerified={setParentMobileVerifyToken}
                        variant="light"
                      />
                      <div>
                        <label className="label">Email (optional)</label>
                        <input type="email" value={form.parentEmail} onChange={set("parentEmail")} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <input required value={form.address} onChange={set("address")} className="input" />
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Anything else?" icon={MessageSquare}>
                    <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Optional - any questions or details you'd like us to know" className="input" />
                  </FieldGroup>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-glow flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-amber-600 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit application"
                    )}
                  </button>

                  <p className="text-center text-xs text-navy-400">
                    Already have an admission number?{" "}
                    <Link to="/signup" className="font-semibold text-teal-700 hover:underline">
                      Create your student account
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FieldGroup({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-700">
          <Icon size={13} />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-navy-500">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
