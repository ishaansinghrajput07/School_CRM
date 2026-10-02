import { Link } from "react-router-dom";
import { Megaphone, GraduationCap, PartyPopper, Umbrella, BookOpen, Trophy, ArrowRight } from "lucide-react";
import useReveal from "../../hooks/useReveal";

const NEWS = [
  {
    icon: GraduationCap,
    tone: "bg-teal-100 text-teal-700",
    tag: "Admissions",
    title: "Admissions Open for 2026–27",
    body: "Registrations for Nursery to Class XI are now open. Limited seats per section.",
    href: "/signup",
    cta: "Apply Now",
  },
  {
    icon: Trophy,
    tone: "bg-amber-100 text-amber-700",
    tag: "Scholarship",
    title: "Merit Scholarship Notice",
    body: "Up to 50% fee waiver for students scoring 90%+ in their previous board exam.",
    href: "#admissions",
    cta: "See Eligibility",
  },
  {
    icon: PartyPopper,
    tone: "bg-violet-100 text-violet-700",
    tag: "Events",
    title: "Annual Cultural Fest — Save the Date",
    body: "Music, dance, drama and art competitions across all age groups this term.",
    href: "#events",
    cta: "View Schedule",
  },
  {
    icon: Umbrella,
    tone: "bg-coral-100 text-coral-600",
    tag: "Holiday",
    title: "Mid-Term Holiday Notice",
    body: "School will remain closed for the mid-term break. Classes resume the following Monday.",
    href: "#contact",
    cta: "Read Notice",
  },
  {
    icon: BookOpen,
    tone: "bg-navy-100 text-navy-700",
    tag: "Exams",
    title: "Exam Schedule Released",
    body: "Term exam dates and syllabus coverage for Classes VI–XII are now published.",
    href: "#academics",
    cta: "View Syllabus",
  },
  {
    icon: Megaphone,
    tone: "bg-amber-100 text-amber-700",
    tag: "Olympiad",
    title: "Olympiad Registration Open",
    body: "Register for Science, Maths and English Olympiads before the deadline.",
    href: "#contact",
    cta: "Register Interest",
  },
];

export default function LatestNews() {
  const headRef = useReveal();
  return (
    <section id="news" className="relative bg-paper px-6 py-24">
      <div className="mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Stay Informed</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Latest News</h2>
          <p className="mt-3 text-navy-600">Admissions, notices and announcements from the school office.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((n, i) => (
            <NewsCard key={n.title} {...n} delay={(i % 3) * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsCard({ icon: Icon, tone, tag, title, body, href, cta, delay }) {
  const ref = useReveal(delay);
  const isInternal = href.startsWith("/");
  const CardInner = (
    <>
      <span className={`premium-icon inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
        <Icon size={12} /> {tag}
      </span>
      <h3 className="mt-3 font-serif text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:gap-2.5 transition-all">
        {cta} <ArrowRight size={14} />
      </span>
    </>
  );

  return isInternal ? (
    <Link ref={ref} to={href} className="reveal premium-card group block rounded-2xl border border-navy-900/10 bg-white p-6">
      {CardInner}
    </Link>
  ) : (
    <a ref={ref} href={href} className="reveal premium-card group block rounded-2xl border border-navy-900/10 bg-white p-6">
      {CardInner}
    </a>
  );
}
