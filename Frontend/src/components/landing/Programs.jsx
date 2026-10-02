import { Baby, BookOpen, FlaskConical, GraduationCap, ArrowRight } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const PROGRAMS = [
  {
    icon: Baby,
    stage: "Pre-Primary",
    range: "Nursery to UKG",
    ages: "Ages 3–5",
    points: ["Play-based learning", "Activity rooms", "Montessori approach", "Safe environment"],
    tone: "coral",
  },
  {
    icon: BookOpen,
    stage: "Primary",
    range: "Class I to V",
    ages: "Ages 6–10",
    points: ["CBSE curriculum", "EVS & languages", "Art & craft", "Personality development"],
    tone: "teal",
  },
  {
    icon: FlaskConical,
    stage: "Middle School",
    range: "Class VI to VIII",
    ages: "Ages 11–13",
    points: ["Subject specialization", "Science labs", "Digital learning", "Olympiad prep"],
    tone: "amber",
  },
  {
    icon: GraduationCap,
    stage: "Secondary",
    range: "Class IX to X",
    ages: "Ages 14–15",
    points: ["Board exam prep", "Career guidance", "Competitive exams", "Skill workshops"],
    tone: "violet",
  },
];

const TONE_STYLES = {
  coral: {
    card: "bg-coral-50 border-coral-200",
    icon: "bg-coral-500 text-white border-coral-500",
    range: "text-coral-600",
    dot: "bg-coral-500",
    underline: "border-coral-500",
  },
  teal: {
    card: "bg-teal-50 border-teal-200",
    icon: "bg-teal-500 text-white border-teal-500",
    range: "text-teal-700",
    dot: "bg-teal-500",
    underline: "border-teal-500",
  },
  amber: {
    card: "bg-amber-50 border-amber-200",
    icon: "bg-amber-500 text-navy-900 border-amber-500",
    range: "text-amber-700",
    dot: "bg-amber-500",
    underline: "border-amber-500",
  },
  violet: {
    card: "bg-violet-50 border-violet-200",
    icon: "bg-violet-500 text-white border-violet-500",
    range: "text-violet-700",
    dot: "bg-violet-500",
    underline: "border-violet-500",
  },
};

export default function Programs() {
  const headRef = useReveal();
  return (
    <section id="programs" className="relative overflow-hidden bg-white px-6 py-24">
      <ParallaxDecor tone="teal" />
      <div className="relative z-10 mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Academic Programs</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            Comprehensive education for every stage
          </h2>
          <p className="mt-3 text-navy-600">CBSE curriculum-based programs designed to nurture knowledge, skills and character.</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {PROGRAMS.map((p, i) => (
            <ProgramCard key={p.stage} {...p} tone={TONE_STYLES[p.tone]} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCard({ icon: Icon, stage, range, ages, points, tone, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className={`reveal premium-card flex flex-col rounded-2xl border-2 p-6 ${tone.card}`}>
      <span className={`premium-icon flex h-12 w-12 items-center justify-center rounded-full border-2 ${tone.icon}`}>
        <Icon size={20} />
      </span>
      <p className="mt-4 font-serif text-lg font-semibold text-navy-900">{stage}</p>
      <p className={`text-sm font-medium ${tone.range}`}>{range}</p>
      <p className="text-xs text-navy-400">{ages}</p>
      <ul className="mt-4 flex-1 space-y-2 border-t border-dashed border-navy-900/15 pt-4 text-sm text-navy-600">
        {points.map((pt) => (
          <li key={pt} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
            {pt}
          </li>
        ))}
      </ul>
      <a
        href="#admissions"
        className="group/cta mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 transition-colors hover:text-teal-700"
      >
        <span className={`border-b-2 pb-0.5 ${tone.underline}`}>Learn more</span>
        <ArrowRight size={14} className="transition-transform duration-300 group-hover/cta:translate-x-1.5" />
      </a>
    </div>
  );
}