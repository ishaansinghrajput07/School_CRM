import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Trophy,
  TrendingUp,
  CalendarCheck,
  Award,
  BookOpen,
  ClipboardList,
  Wallet,
  Megaphone,
  CalendarDays,
  IdCard,
  Library,
  School,
} from "lucide-react";

const STATS = [
  { icon: GraduationCap, value: "2,500+", label: "Students" },
  { icon: Users, value: "150+", label: "Teachers" },
  { icon: Trophy, value: "25+", label: "Years of Excellence" },
  { icon: TrendingUp, value: "98%", label: "Board Results" },
];

// Small floating info cards, per spec - muted green/beige accents rather
// than the earlier feature-chip row.
const INFO_CARDS = [
  { icon: CalendarCheck, label: "Attendance", tone: "sage" },
  { icon: IdCard, label: "Digital ID", tone: "gold" },
  { icon: BookOpen, label: "Homework", tone: "sage" },
  { icon: Library, label: "Library", tone: "olive" },
  { icon: Award, label: "Results", tone: "gold" },
  { icon: Wallet, label: "Fee Status", tone: "sage" },
];

const TONE_CLASSES = {
  sage: "bg-[#4F7C5A]/10 text-[#4F7C5A]",
  olive: "bg-[#6B9B72]/12 text-[#6B9B72]",
  gold: "bg-[#A88B5B]/12 text-[#A88B5B]",
};

export default function AuthHero() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#F8F7F2] to-[#F3EFE6] lg:flex lg:w-[56%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Soft organic blobs - no stock photo, just gentle abstract shapes */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-28 top-0 h-[26rem] w-[26rem] rounded-[45%_55%_60%_40%/50%_40%_60%_50%] bg-[#6B9B72]/[0.14] blur-2xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 22, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 bottom-0 h-[24rem] w-[24rem] rounded-[55%_45%_40%_60%/45%_55%_45%_55%] bg-[#A88B5B]/[0.10] blur-2xl"
        />
        <div className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-[#4F7C5A]/[0.07] blur-3xl" />
      </div>

      {/* Logo + school name */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7C5A] to-[#6B9B72] text-white shadow-md shadow-[#4F7C5A]/20">
          <GraduationCap size={22} />
        </div>
        <div>
          <p className="font-display text-base font-bold leading-tight text-[#2F3A2F]">St. Thomas Convent</p>
          <p className="text-xs text-[#1A1D18]">Hr. Sec. School, Indore</p>
        </div>
      </motion.div>

      {/* Welcome copy + soft illustration */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative z-10 max-w-lg">
        <div className="relative mb-2 flex h-16 w-16 items-center justify-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#4F7C5A] shadow-[0_8px_24px_rgba(79,124,90,0.15)]"
          >
            <School size={30} strokeWidth={1.6} />
          </motion.div>
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight text-[#2F3A2F] xl:text-5xl">
          Empowering Education <span className="text-[#4F7C5A]">Through Technology</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-[#1A1D18]">
          Access attendance, assignments, results, fee management, notices, digital ID cards, and academic resources — all from one secure portal.
        </p>

        {/* Floating info cards */}
        <div className="mt-7 flex flex-wrap gap-2.5">
          {INFO_CARDS.map(({ icon: Icon, label, tone }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-2 rounded-2xl border border-[#E7E2D8] bg-white/80 px-3.5 py-2 shadow-[0_4px_16px_rgba(47,58,47,0.05)] backdrop-blur-sm"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>
                <Icon size={12.5} />
              </span>
              <span className="text-xs font-medium text-[#2F3A2F]">{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-2 gap-4">
        {STATS.map(({ icon: Icon, value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-[#E7E2D8] bg-white p-4 shadow-[0_6px_20px_rgba(47,58,47,0.06)]"
          >
            <Icon size={18} className="text-[#4F7C5A]" />
            <p className="mt-2 font-display text-xl font-bold text-[#2F3A2F]">{value}</p>
            <p className="text-xs text-[#1A1D18]">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
