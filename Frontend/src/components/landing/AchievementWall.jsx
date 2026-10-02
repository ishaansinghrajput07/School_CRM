import { Trophy, Medal, Palette, Drama, Music, Bot, BookOpenCheck } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const ACHIEVEMENTS = [
  { icon: Trophy, label: "National Awards", tone: "from-amber-400 to-amber-500" },
  { icon: Medal, label: "Sports Championship", tone: "from-teal-500 to-teal-600" },
  { icon: Palette, label: "Art Competition", tone: "from-violet-400 to-violet-500" },
  { icon: Drama, label: "Drama Competition", tone: "from-coral-400 to-coral-500" },
  { icon: Music, label: "Music Competition", tone: "from-navy-500 to-navy-600" },
  { icon: Bot, label: "Robotics Championship", tone: "from-teal-500 to-navy-500" },
  { icon: BookOpenCheck, label: "Olympiad Winners", tone: "from-amber-500 to-coral-500" },
];

export default function AchievementWall() {
  const headRef = useReveal();
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24">
      <ParallaxDecor tone="amber" />
      <div className="relative mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Wall of Fame</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Achievement Wall</h2>
          <p className="mt-3 text-navy-600">A snapshot of the trophies, titles and recognitions our students bring home.</p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-7">
          {ACHIEVEMENTS.map((a, i) => (
            <AchievementCard key={a.label} {...a} delay={i * 70} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AchievementCard({ icon: Icon, label, tone, delay }) {
  const ref = useReveal(delay);
  return (
    <div
      ref={ref}
      className="reveal premium-card flex flex-col items-center gap-3 rounded-2xl border border-navy-900/10 bg-paper/60 p-5 text-center"
    >
      <span className={`premium-icon flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-white shadow-md`}>
        <Icon size={20} />
      </span>
      <p className="text-xs font-semibold leading-tight text-navy-800">{label}</p>
    </div>
  );
}
