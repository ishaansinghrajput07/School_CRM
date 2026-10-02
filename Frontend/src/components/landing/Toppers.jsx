import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  GraduationCap,
  Award,
  Rocket,
  Stethoscope,
  MapPin,
  Gift,
  TrendingUp,
  ArrowRight,
  X,
  Sparkles,
  Quote
} from "lucide-react";
import { toppersApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import useCountUpOnView from "../../hooks/useCountUpOnView";

// Headline achievement stats
const ACHIEVEMENTS = [
  { icon: TrendingUp, value: "98", suffix: "%", label: "Board Result" },
  { icon: Award, value: "150", suffix: "+", label: "Distinctions" },
  { icon: Rocket, value: "25", suffix: "+", label: "Olympiad Winners" },
  { icon: GraduationCap, value: "12", suffix: "+", label: "IIT Selections" },
  { icon: Stethoscope, value: "18", suffix: "+", label: "NEET Selections" },
  { icon: MapPin, value: "15", suffix: "+", label: "District Rank Holders" },
];

function getBadge(topper) {
  const rank = parseInt(topper.rank, 10);
  if (rank === 1) return { emoji: "🥇", label: "School Topper" };
  if (topper.stream) {
    const emoji = rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";
    return { emoji, label: `${topper.stream} Topper` };
  }
  if (rank === 2) return { emoji: "🥈", label: "Runner-up" };
  if (rank === 3) return { emoji: "🥉", label: "Third Rank" };
  return { emoji: "🏅", label: topper.rank ? `Rank ${topper.rank}` : "Topper" };
}

const CONFETTI = [
  { left: "10%", delay: 0, duration: 2.6, color: "#F4B63D" },
  { left: "25%", delay: 0.4, duration: 3.1, color: "#FFD56A" },
  { left: "45%", delay: 0.8, duration: 2.4, color: "#F4B63D" },
  { left: "65%", delay: 0.2, duration: 2.9, color: "#ffffff" },
  { left: "80%", delay: 0.6, duration: 2.7, color: "#F4B63D" },
  { left: "92%", delay: 1, duration: 3, color: "#FFD56A" },
];

export default function Toppers() {
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(null);
  const [classFilter, setClassFilter] = useState(null);

  useEffect(() => {
    toppersApi
      .public()
      .then(({ data }) => {
        setToppers(data.toppers);
        if (data.toppers.length > 0) setYear(data.toppers[0].academicYear);
      })
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const unique = [...new Set(toppers.map((t) => t.academicYear))];
    return unique.sort((a, b) => b.localeCompare(a));
  }, [toppers]);

  const classesForYear = useMemo(() => {
    const inYear = toppers.filter((t) => t.academicYear === year);
    const unique = [...new Set(inYear.map((t) => t.grade))].filter(Boolean);
    return unique.sort((a, b) => a.localeCompare(b));
  }, [toppers, year]);

  useEffect(() => {
    if (classesForYear.length > 0 && !classesForYear.includes(classFilter)) {
      setClassFilter(classesForYear[0]);
    }
  }, [classesForYear]);

  const shownToppers = toppers.filter(
    (t) => t.academicYear === year && (!classFilter || t.grade === classFilter)
  );

  if (!loading && toppers.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfcfb] to-white px-6 py-24">
      {/* Premium Background Elements */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#081b33 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-amber-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-5%] top-[40%] h-[600px] w-[600px] rounded-full bg-[#081b33]/5 blur-[120px]" />

      <div className="relative mx-auto max-w-[1400px]">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-bold uppercase tracking-widest text-amber-500">
            Academic Excellence
          </span>
          <h2 className="mt-4 font-serif text-4xl font-bold text-[#081b33] sm:text-5xl">
            Our Toppers
          </h2>
          <p className="mt-4 text-lg text-[#081b33]/60">
            Celebrating our highest achievers and the dedication that drives them.
          </p>
        </motion.div>

        {/* Animated Segmented Controls */}
        {(years.length > 1 || classesForYear.length > 1) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            {years.length > 1 && (
              <SegmentedControl options={years} value={year} onChange={setYear} layoutGroupId="years" />
            )}
            {classesForYear.length > 1 && (
              <SegmentedControl options={classesForYear} value={classFilter} onChange={setClassFilter} compact layoutGroupId="classes" />
            )}
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[1fr_1.5fr] lg:items-stretch">
          
          {/* Toppers Column */}
          {loading ? (
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {[1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-[#081b33]/5" />
              ))}
            </div>
          ) : (
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {shownToppers.map((t, i) => (
                  <TopperCard key={t._id} topper={t} delay={i * 0.1} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Achievement Snapshot Column */}
          <AchievementPanel />

        </div>
      </div>
    </section>
  );
}

/* --- Animated Segmented Control --- */
function SegmentedControl({ options, value, onChange, compact = false, layoutGroupId }) {
  return (
    <div className="relative flex items-center rounded-full border border-[#081b33]/5 bg-white p-1.5 shadow-sm">
      {options.map((opt) => {
        const isActive = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative rounded-full font-medium transition-colors duration-300 ${
              compact ? "px-4 py-1.5 text-xs" : "px-6 py-2 text-sm"
            } ${isActive ? "text-white" : "text-[#081b33]/60 hover:text-[#081b33]"}`}
          >
            {isActive && (
              <motion.div
                layoutId={`active-pill-${layoutGroupId}`}
                className="absolute inset-0 rounded-full bg-[#081b33] shadow-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --- Premium Topper Card --- */
const TopperCard = React.forwardRef(function TopperCard({ topper, delay }, ref) {
  const [expanded, setExpanded] = useState(false);
  const badge = getBadge(topper);
  const isSchoolTopper = badge.label === "School Topper";

  // Fallback achievements to match your wireframe if the API doesn't provide them yet
  const achievements = topper.achievements || [
    { icon: "🥇", text: "District Rank" },
    { icon: "📚", text: "Olympiad Winner" },
    { icon: "⭐", text: "Attendance 99%" }
  ];

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-[#081b33]/10 bg-[#081b33] p-8 text-center shadow-xl transition-shadow hover:shadow-2xl hover:shadow-[#081b33]/20"
    >
      {/* Subtle background glow inside card */}
      <div className="absolute -top-20 right-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl transition-all duration-500 group-hover:bg-amber-400/20" />

      {/* Falling Confetti for School Toppers */}
      {isSchoolTopper &&
        CONFETTI.map((c, i) => (
          <motion.div
            key={i}
            className="absolute top-0 h-1.5 w-1.5 rounded-full"
            style={{ left: c.left, backgroundColor: c.color }}
            animate={{
              y: ["-10px", "150px"],
              rotate: [0, 360],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}

      {/* Top Centered Trophy */}
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 10 }}
        className={`mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg ${
          isSchoolTopper ? "shadow-amber-500/40" : ""
        }`}
      >
        <Trophy size={18} className="text-amber-900" />
      </motion.div>

      {/* Profile Image with Golden Glow */}
      <div className="relative mx-auto mb-4 h-[120px] w-[120px] shrink-0 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-transform duration-500 group-hover:scale-105">
        <div className="h-full w-full overflow-hidden rounded-full border-4 border-[#081b33] bg-[#081b33]">
          {topper.photoUrl ? (
            <img
              src={resolveFileUrl(topper.photoUrl)}
              alt={topper.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/20">
              <GraduationCap size={40} />
            </div>
          )}
        </div>
      </div>

      {/* Text Content */}
      <h3 className="font-serif text-2xl font-bold text-white">{topper.name}</h3>
      
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-400/20">
        <span>{badge.emoji}</span>
        {badge.label}
        {isSchoolTopper && <Sparkles size={12} />}
      </div>
      
      <p className="mt-2 text-sm text-white/60">
        {topper.grade} {topper.stream ? ` • ${topper.stream}` : ""}
      </p>

      {topper.percentage != null && (
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="font-serif text-4xl font-bold text-white">{topper.percentage}</span>
          <span className="text-lg font-semibold text-amber-400">%</span>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="mt-4 flex items-center justify-center px-2">
        <p className="text-sm italic text-white/70 line-clamp-2 leading-relaxed">
          "{topper.quote || "Success comes from consistency."}"
        </p>
      </div>

      {/* NEW: Achievement List */}
      <div className="mt-5 w-full space-y-2 rounded-xl bg-white/5 p-4 text-left">
        {achievements.map((ach, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm text-white/80">
            <span className="text-base">{ach.icon}</span>
            <span className="font-medium">{ach.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => setExpanded(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-[#081b33] transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
      >
        View Profile
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </button>

      {/* Expand Overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-[#081b33]/95"
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">{topper.name}</h3>
            <p className="mb-6 text-sm text-amber-400">{badge.label}</p>
            <p className="text-center text-sm text-white/70 italic leading-relaxed">
              "{topper.quote || "Hard work and guidance from my teachers helped me achieve this milestone. I am grateful for the school's support."}"
            </p>
            <p className="mt-6 text-xs uppercase tracking-widest text-white/30">Class of {topper.academicYear}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/* --- Premium Achievement Panel --- */
function AchievementPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex h-full flex-col rounded-3xl border border-[#081b33]/5 bg-white p-8 shadow-xl shadow-[#081b33]/5"
    >
      <div className="mb-8 border-b border-gray-100 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
          This Year
        </span>
        <h3 className="mt-2 font-serif text-3xl font-bold text-[#081b33]">
          Achievement Snapshot
        </h3>
        <p className="mt-2 text-sm text-[#081b33]/60">
          Breaking records and setting new academic benchmarks across all disciplines.
        </p>
      </div>
      
      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a, index) => (
          <AchievementStat key={a.label} stat={a} delay={index * 0.1} />
        ))}
      </div>
      
      <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#081b33]/5 p-4 text-sm text-[#081b33]/70">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Gift size={16} />
        </div>
        <p>
          <strong className="font-semibold text-[#081b33]">100% Scholarships</strong> awarded to every district rank holder.
        </p>
      </div>
    </motion.div>
  );
}

/* --- Metric Card with CountUp --- */
function AchievementStat({ stat, delay }) {
  const { icon: Icon, value, suffix, label } = stat;
  const [ref, display] = useCountUpOnView(value);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group flex flex-col justify-center rounded-2xl border border-gray-100 bg-[#fbfaf8] p-5 transition-all hover:border-amber-200 hover:bg-white hover:shadow-lg hover:shadow-amber-500/5"
    >
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-colors group-hover:bg-amber-50 group-hover:text-amber-600 text-[#081b33]/40">
        <Icon size={20} />
      </div>
      <div className="flex items-baseline gap-0.5">
        <p ref={ref} className="font-serif text-3xl font-bold text-[#081b33]">
          {display}
        </p>
        <span className="text-lg font-bold text-amber-500">{suffix}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-[#081b33]/50 leading-tight">
        {label}
      </p>
    </motion.div>
  );
}