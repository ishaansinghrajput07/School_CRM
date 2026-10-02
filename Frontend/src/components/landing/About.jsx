import { Sparkles, Users, HeartHandshake, Compass } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const VALUES = [
  {
    icon: Sparkles,
    title: "Excellence",
    body: "We hold every student to the highest standard we can help them reach — never a ceiling, always a floor.",
    tone: "bg-amber-500 text-navy-900 border-amber-500",
  },
  {
    icon: HeartHandshake,
    title: "Inclusivity",
    body: "Every child who walks through our gates is welcomed exactly as they are, from every background.",
    tone: "bg-coral-500 text-white border-coral-500",
  },
  {
    icon: Compass,
    title: "Innovation",
    body: "Modern teaching methods and smart classrooms sit alongside — not instead of — real classroom attention.",
    tone: "bg-teal-500 text-white border-teal-500",
  },
  {
    icon: Users,
    title: "Values",
    body: "Character and Indian cultural values are woven through the school day, not confined to one period a week.",
    tone: "bg-violet-500 text-white border-violet-500",
  },
];

export default function About() {
  const introRef = useReveal();

  return (
    <section id="about" className="relative overflow-hidden bg-white px-6 py-24">
      <ParallaxDecor tone="amber" />
      <div className="relative z-10 mx-auto max-w-[1560px]">
        <div ref={introRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">About Our School</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            Shaping tomorrow's leaders, today
          </h2>
          <p className="mt-4 text-navy-600">
            Established in 2010, St. Thomas Convent Hr. Sec. School has been a beacon of quality
            education in Indore. Built on the CBSE curriculum, we provide comprehensive
            education from Nursery to Class XII — blending academic rigour with holistic
            development. Our faculty of 80+ experienced teachers ensures personal attention
            for every child.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <ValueCard key={v.title} {...v} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ icon: Icon, title, body, tone, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal premium-card rounded-2xl border border-navy-900/15 bg-paper-dark p-6">
      <span className={`premium-icon flex h-11 w-11 items-center justify-center rounded-full border-2 ${tone}`}>
        <Icon size={18} />
      </span>
      <h3 className="mt-4 font-serif text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">{body}</p>
    </div>
  );
}