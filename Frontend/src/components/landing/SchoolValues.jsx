import { HeartHandshake, ShieldCheck, Lightbulb, Compass, Star, Palette, Users2, HandHeart } from "lucide-react";
import useReveal from "../../hooks/useReveal";

const VALUES = [
  { icon: HeartHandshake, title: "Respect", body: "For self, others and the world around us." },
  { icon: ShieldCheck, title: "Integrity", body: "Doing the right thing, especially unseen." },
  { icon: Lightbulb, title: "Innovation", body: "Curiosity that turns into new ideas." },
  { icon: Compass, title: "Leadership", body: "Guiding with empathy and confidence." },
  { icon: Star, title: "Excellence", body: "Striving for one's personal best, always." },
  { icon: Palette, title: "Creativity", body: "Expression across art, science and ideas." },
  { icon: Users2, title: "Teamwork", body: "Achieving more together than alone." },
  { icon: HandHeart, title: "Responsibility", body: "Owning our actions and their impact." },
];

export default function SchoolValues() {
  const headRef = useReveal();
  return (
    <section className="relative bg-white px-6 py-24">
      <div className="mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">What We Stand For</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">School Values</h2>
          <p className="mt-3 text-navy-600">The eight principles woven into every classroom, corridor and conversation.</p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {VALUES.map((v, i) => (
            <ValueCard key={v.title} {...v} delay={(i % 4) * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ icon: Icon, title, body, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal premium-card rounded-2xl border border-navy-900/10 bg-paper/60 p-6 text-center">
      <span className="premium-icon mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-md">
        <Icon size={20} />
      </span>
      <h3 className="mt-4 font-serif text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-navy-500">{body}</p>
    </div>
  );
}
