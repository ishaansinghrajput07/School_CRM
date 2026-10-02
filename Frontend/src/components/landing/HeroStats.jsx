import { motion } from "framer-motion";
import { Users, GraduationCap, CalendarClock, BookOpen } from "lucide-react";

// Matches the same headline numbers used in the Stats Strip section further
// down the page - kept in sync by hand since they're a handful of figures
// that change once a year, not ongoing admin-editable content.
const stats = [
  { icon: Users, value: "1,200+", label: "Students" },
  { icon: GraduationCap, value: "80+", label: "Faculty" },
  { icon: CalendarClock, value: "15+", label: "Years" },
  { icon: BookOpen, value: "CBSE", label: "Curriculum" },
];

export default function HeroStats() {
  return (
    // The parent Hero.jsx is now managing the placement, 
    // so we just define the grid taking up the full width.
    <div className="z-20 w-full">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.15, duration: 0.6 }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl transition-all duration-300 lg:rounded-2xl lg:p-5"
            >
              {/* Mobile Icon Style (hidden on large screens) */}
              <Icon className="mb-2 text-amber-400 lg:hidden" size={20} />

              {/* Desktop Icon Style (hidden on small screens) */}
              <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-lg lg:flex">
                <Icon size={22} />
              </div>

              {/* Responsive Typography */}
              <h3 className="text-xl font-bold text-white lg:text-3xl">
                {item.value}
              </h3>
              <p className="mt-1 text-xs text-white/75 lg:mt-2 lg:text-sm">
                {item.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}