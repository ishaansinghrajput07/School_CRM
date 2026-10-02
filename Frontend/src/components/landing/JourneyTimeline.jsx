import { Flag, Building2, Cpu, Trophy, Globe2, Sparkles } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const MILESTONES = [
  { year: "2010", icon: Flag, title: "School Founded", body: "St. Thomas Convent opens its doors from Nursery to Class VIII." },
  { year: "2013", icon: Building2, title: "New Campus Wing", body: "Expanded campus with dedicated science and computer labs." },
  { year: "2016", icon: Cpu, title: "Smart Classrooms", body: "Interactive boards and digital learning rolled out school-wide." },
  { year: "2020", icon: Globe2, title: "Digital-First Learning", body: "Parent portal and online learning tools launched for every family." },
  { year: "2023", icon: Trophy, title: "Board Toppers", body: "Record board results and district-topping performances." },
  { year: "2026", icon: Sparkles, title: "AI & Robotics Lab", body: "AI learning and a dedicated robotics lab open for senior students." },
];

export default function JourneyTimeline() {
  const headRef = useReveal();
  return (
    <section className="relative overflow-hidden bg-paper px-6 py-24">
      <ParallaxDecor tone="teal" />
      <div className="relative mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Our Story</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">School Journey</h2>
          <p className="mt-3 text-navy-600">Sixteen years of milestones, one child at a time.</p>
        </div>

        {/* Horizontal timeline on desktop, vertical stack on mobile */}
        <div className="mt-16 hidden lg:block">
          <div className="relative">
            <div className="absolute left-0 right-0 top-6 h-px bg-navy-900/15" aria-hidden />
            <div className="grid grid-cols-6 gap-4">
              {MILESTONES.map((m, i) => (
                <TimelineNode key={m.year} {...m} delay={i * 100} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-6 border-l-2 border-navy-900/10 pl-6 lg:hidden">
          {MILESTONES.map((m, i) => (
            <TimelineRow key={m.year} {...m} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineNode({ year, icon: Icon, title, body, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal text-center">
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-navy-900 bg-white text-navy-900 shadow-md">
        <Icon size={18} />
      </div>
      <p className="mt-4 font-serif text-lg font-bold text-amber-600">{year}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-navy-500">{body}</p>
    </div>
  );
}

function TimelineRow({ year, icon: Icon, title, body, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal relative">
      <span className="absolute -left-[31px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy-900 bg-white text-navy-900">
        <Icon size={14} />
      </span>
      <p className="font-serif text-base font-bold text-amber-600">{year}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-navy-500">{body}</p>
    </div>
  );
}
