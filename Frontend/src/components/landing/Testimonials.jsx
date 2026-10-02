import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Send,
  CheckCircle2,
  Users,
  GraduationCap,
  BookOpen,
  Feather,
  Loader2,
} from "lucide-react";
import Avatar from "../ui/Avatar";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";
import { feedbackApi } from "../../api/endpoints";

const AUTO_ADVANCE_MS = 6000;

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

export default function Testimonials() {
  const headRef = useReveal();
  const carouselRef = useRef(null);
  const carouselInView = useInView(carouselRef, { once: true, amount: 0.3 });

  const [quotes, setQuotes] = useState(null); // null = loading
  const [[active, direction], setSlide] = useState([0, 0]);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    feedbackApi
      .publicList()
      .then(({ data }) => setQuotes(data.feedback || []))
      .catch(() => setQuotes([]));
  }, []);

  const goTo = (i, dir) => {
    if (!quotes?.length) return;
    setSlide([((i % quotes.length) + quotes.length) % quotes.length, dir]);
  };
  const next = () => goTo(active + 1, 1);
  const prev = () => goTo(active - 1, -1);

  useEffect(() => {
    if (paused || !carouselInView || !quotes?.length) return;
    timerRef.current = setInterval(() => goTo(active + 1, 1), AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, carouselInView, active, quotes]);

  const handleDragEnd = (_e, info) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  };

  const quote = quotes?.[active];
  const avgRating = quotes?.length ? quotes.reduce((sum, q) => sum + q.rating, 0) / quotes.length : null;

  return (
    <section id="reviews" className="relative overflow-hidden bg-gradient-to-b from-paper via-[#FFFCF6] to-paper px-6 py-24">
      <ParallaxDecor tone="teal" />

      <div className="pointer-events-none absolute left-1/4 top-10 h-72 w-72 rounded-full bg-amber-300/20 blur-[110px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-teal-300/15 blur-[100px]" aria-hidden />

      <GraduationCap size={420} strokeWidth={0.6} className="pointer-events-none absolute -right-24 -top-24 text-navy-900/[0.035]" aria-hidden />
      <BookOpen size={260} strokeWidth={0.6} className="pointer-events-none absolute -bottom-16 -left-16 rotate-[-8deg] text-teal-900/[0.035]" aria-hidden />
      <Feather size={120} strokeWidth={0.6} className="pointer-events-none absolute right-[8%] top-[55%] rotate-12 text-amber-700/[0.04]" aria-hidden />

      {[
        { top: "18%", left: "6%", size: 6, delay: "0s" },
        { top: "70%", left: "10%", size: 4, delay: "1.2s" },
        { top: "30%", right: "8%", size: 5, delay: "0.6s" },
        { top: "80%", right: "14%", size: 4, delay: "1.8s" },
      ].map((p, i) => (
        <span
          key={i}
          className="animate-float pointer-events-none absolute rounded-full bg-amber-400/40"
          style={{ top: p.top, left: p.left, right: p.right, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: "6s" }}
          aria-hidden
        />
      ))}

      <div className="relative mx-auto max-w-[1400px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">From Our School Family</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">What Parents Say</h2>
          <p className="mt-2 text-sm text-navy-500">Real stories from parents who are part of our journey.</p>

          {quotes?.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-navy-600">
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" fill="currentColor" strokeWidth={0} /> {avgRating.toFixed(1)} Rating
              </span>
              <span className="h-3 w-px bg-navy-200" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-teal-600" /> {quotes.length} Review{quotes.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-[1.7fr_1fr] md:items-start">
          <div className="relative">
            {quotes === null ? (
              <div className="flex h-72 items-center justify-center rounded-[28px] border border-navy-900/10 bg-white/60">
                <Loader2 className="animate-spin text-navy-300" size={28} />
              </div>
            ) : quotes.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-navy-900/15 bg-white/60 px-8 text-center">
                <Quote size={32} className="text-navy-300" />
                <p className="mt-3 font-serif text-lg font-semibold text-navy-800">No reviews yet</p>
                <p className="mt-1 text-sm text-navy-500">Be the first parent to share your experience — use the form alongside.</p>
              </div>
            ) : (
              <div
                ref={carouselRef}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
              >
                <div className="overflow-hidden rounded-[28px]">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div key={quote.id} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: "easeOut" }}>
                      <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={handleDragEnd} className="cursor-grab active:cursor-grabbing">
                        <QuoteCard {...quote} />
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {quotes.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      aria-label="Previous testimonial"
                      className="group absolute left-0 top-1/2 hidden -translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-navy-900/10 bg-white/90 p-3 text-navy-700 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-amber-400 hover:shadow-[0_0_0_6px_rgba(245,158,11,0.12)] sm:flex"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      aria-label="Next testimonial"
                      className="group absolute right-0 top-1/2 hidden translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-navy-900/10 bg-white/90 p-3 text-navy-700 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-amber-400 hover:shadow-[0_0_0_6px_rgba(245,158,11,0.12)] sm:flex"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}

            {quotes?.length > 1 && (
              <div className="mt-7 flex justify-center gap-2">
                {quotes.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => goTo(i, i > active ? 1 : -1)}
                    aria-label={`Show testimonial from ${q.name}`}
                    aria-current={i === active}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === active ? "w-9 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "w-2.5 bg-navy-900/15 hover:bg-navy-900/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <OverallRatingCard quotes={quotes} avgRating={avgRating} />
            <FeedbackForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ name, role, context, message, rating }) {
  const roleLabel = { parent: "Parent", student: "Student", alumni: "Alumnus/Alumna", staff: "Staff", other: "" }[role] || "";
  return (
    <div
      className="premium-card relative overflow-hidden rounded-[28px] border border-white/60 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12"
      style={{ background: "linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(255,250,235,0.85) 100%)" }}
    >
      <Quote size={130} strokeWidth={0} fill="currentColor" className="pointer-events-none absolute -left-2 -top-6 text-amber-400/15" aria-hidden />

      <div className="relative">
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }} className="flex gap-1 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <Star size={18} fill={i < rating ? "currentColor" : "none"} strokeWidth={i < rating ? 0 : 1.5} />
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative mt-6 max-w-2xl font-serif text-xl italic leading-relaxed text-navy-800 sm:text-[26px] sm:leading-[1.5]"
        >
          "{message}"
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="mt-8 flex items-center gap-4">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 220 }} className="relative shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 p-[2px]">
            <Avatar name={name} size="md" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-navy-900">{name}</p>
            <p className="mt-0.5 text-xs text-navy-400">
              {roleLabel}
              {context ? ` • ${context}` : ""}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function OverallRatingCard({ quotes, avgRating }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const hasData = quotes?.length > 0;

  // Star-by-star breakdown, computed from real submissions - no fabricated
  // "would recommend" / "Google rating" figures that aren't backed by data.
  const breakdown = hasData
    ? [5, 4, 3, 2, 1].map((star) => ({
        star,
        pct: Math.round((quotes.filter((q) => q.rating === star).length / quotes.length) * 100),
      }))
    : [];

  return (
    <div ref={ref} className="premium-card rounded-2xl border-2 border-navy-900/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-3xl font-bold text-navy-900">
            {hasData ? avgRating.toFixed(1) : "—"}
            <span className="text-base font-medium text-navy-400">/5</span>
          </p>
          <div className="mt-1 flex gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} fill={hasData && i < Math.round(avgRating) ? "currentColor" : "none"} strokeWidth={hasData && i < Math.round(avgRating) ? 0 : 1.5} />
            ))}
          </div>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100 text-amber-500">
          <Star size={22} fill="currentColor" strokeWidth={0} />
        </span>
      </div>
      <p className="mt-2 text-xs text-navy-500">{hasData ? `Based on ${quotes.length} parent review${quotes.length === 1 ? "" : "s"}` : "No reviews yet"}</p>

      {hasData && (
        <div className="mt-5 space-y-2.5 border-t border-dashed border-navy-100 pt-4">
          {breakdown.map(({ star, pct }, i) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="flex w-8 items-center gap-0.5 font-medium text-navy-500">
                {star} <Star size={10} className="text-amber-500" fill="currentColor" strokeWidth={0} />
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${pct}%` } : { width: 0 }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                />
              </div>
              <span className="w-8 text-right font-semibold text-navy-700">{pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackForm() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");
  const [context, setContext] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please choose a star rating");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { data } = await feedbackApi.submit({
        name: name.trim(),
        role,
        context: context.trim(),
        rating,
        message: message.trim(),
      });
      if (!data.success) {
        throw new Error(data.message || "Feedback was not saved");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit right now - please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-card overflow-hidden rounded-2xl border-2 border-navy-900/10 bg-white p-7 text-center">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="flex flex-col items-center py-4"
          >
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 260 }} className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <CheckCircle2 size={26} />
            </motion.div>
            <p className="font-serif text-lg font-semibold text-navy-900">Thank you!</p>
            <p className="mt-1 text-sm text-navy-500">Your feedback has been saved. Our team reviews every submission before it appears here.</p>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
            <p className="font-serif text-xl font-semibold text-navy-900">Have feedback for us?</p>
            <p className="mt-1 text-sm text-navy-500">We'd love to hear your thoughts &amp; suggestions.</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input rounded-xl text-sm" />
              <select required value={role} onChange={(e) => setRole(e.target.value)} className="input rounded-xl text-sm">
                <option value="parent">Parent</option>
                <option value="student">Student</option>
                <option value="alumni">Alumnus/Alumna</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <input maxLength={60} value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Class VI, or graduating year" className="input mt-2 rounded-xl text-left text-sm" />

            <div className="mt-4 flex justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                return (
                  <motion.button
                    type="button"
                    key={value}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.15 }}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    className="text-amber-500"
                  >
                    <Star size={24} fill={(hover || rating) >= value ? "currentColor" : "none"} strokeWidth={1.5} />
                  </motion.button>
                );
              })}
            </div>

            <textarea
              required
              rows={2}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's working and what isn't..."
              className="input mt-4 rounded-xl"
            />

            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

            <motion.button
              type="submit"
              disabled={submitting}
              aria-label="Submit review"
              whileHover={{ scale: submitting ? 1 : 1.06 }}
              whileTap={{ scale: submitting ? 1 : 0.94 }}
              className="btn-glow mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-navy-900 shadow-md hover:bg-amber-600 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
