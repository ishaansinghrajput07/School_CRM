import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Users, GraduationCap, CalendarClock, Award, Building2, Trophy } from "lucide-react";

const STATS_DATA = [
  {
    id: 1,
    icon: Users,
    value: 1200,
    suffix: "+",
    title: "Happy Students",
    desc: "Learning with confidence",
  },
  {
    id: 2,
    icon: GraduationCap,
    value: 80,
    suffix: "+",
    title: "Expert Teachers",
    desc: "Dedicated educators",
  },
  {
    id: 3,
    icon: CalendarClock,
    value: 15,
    suffix: "+",
    title: "Years of Excellence",
    desc: "Building bright futures",
  },
  {
    id: 4,
    icon: Award,
    value: 98,
    suffix: "%",
    title: "Board Results",
    desc: "Consistent academic success",
  },
  {
    id: 5,
    icon: Building2,
    value: 35,
    suffix: "+",
    title: "Smart Classrooms",
    desc: "Technology-enabled learning",
  },
  {
    id: 6,
    icon: Trophy,
    value: 150,
    suffix: "+",
    title: "Awards",
    desc: "Recognized across fields",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
};

export default function StatsStrip() {
  return (
    // REDUCED: Changed py-24 lg:py-32 to py-12 lg:py-16
    <section className="relative overflow-hidden bg-[#081b33] px-6 py-12 lg:py-16">
      
      {/* Background Enhancements */}
      <div 
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px]" 
        aria-hidden="true" 
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#081b33] to-transparent" />

      <div className="relative mx-auto max-w-[1400px]">
        
        {/* REDUCED: Changed mb-16 to mb-10 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <span className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400 lg:text-sm">
            Our Impact
          </span>
          {/* REDUCED: Heading size adjusted */}
          <h2 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
            Excellence in Every Number
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 lg:text-base">
            Numbers that reflect our commitment to academic excellence, innovation, and student success.
          </p>
          <div className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-6"
        >
          {STATS_DATA.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}

function StatCard({ icon: Icon, value, suffix, title, desc }) {
  return (
    // REDUCED: Changed padding from p-6 to p-4 lg:p-5
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-lg backdrop-blur-md transition-all duration-300 hover:border-amber-400/40 hover:bg-white/10 hover:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.2)] lg:p-5"
    >
      <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-white/5 blur-xl transition-all duration-500 group-hover:bg-amber-400/10" />
      <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 transition-transform duration-500 ease-out group-hover:scale-x-100" />

      {/* REDUCED: Icon wrapper changed from h-16 w-16 to h-12 w-12, margin bottom reduced */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-amber-400 shadow-inner transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:border-amber-400/30 group-hover:text-amber-300">
        <Icon size={24} strokeWidth={1.5} />
      </div>

      {/* REDUCED: Number font size scaled down from 5xl to 4xl */}
      <div className="mb-1 font-serif text-3xl font-bold tracking-tight text-white md:text-4xl">
        <CountUp
          end={value}
          suffix={suffix}
          duration={2.5}
          useEasing={true}
          enableScrollSpy={true}
          scrollSpyOnce={true}
          scrollSpyDelay={100}
        />
      </div>

      {/* REDUCED: Titles and descriptions tightened */}
      <h3 className="mb-1 text-sm font-semibold text-white lg:text-base">
        {title}
      </h3>
      <p className="text-[11px] font-medium leading-snug text-white/50 transition-colors duration-300 group-hover:text-white/70 lg:text-xs">
        {desc}
      </p>
    </motion.div>
  );
}