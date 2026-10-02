import { useState } from "react";
import { GraduationCap, Facebook, Instagram, Youtube, Linkedin, MapPin, Phone, Clock, Send, ShieldAlert } from "lucide-react";

const COLUMNS = [
  { heading: "Quick Links", links: [["Home", "#top"], ["About Us", "#about"], ["Academics", "#academics"], ["Admissions", "#admissions"]] },
  { heading: "School Life", links: [["Gallery", "#gallery"], ["Facilities", "#facilities"], ["Programs", "#programs"], ["Parents Say", "#reviews"]] },
  { heading: "Resources", links: [["Syllabus", "#academics"], ["Fee Structure", "#admissions"], ["FAQ", "#faq"], ["Contact", "#contact"]] },
  { heading: "Parent Access", links: [["Parent Portal Login", "/login"], ["Student Login", "/login"], ["Apply for Admission", "/signup"], ["Notices & Events", "#top"]] },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 px-6 pb-10 pt-20">
      <div className="mx-auto max-w-[1560px]">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.1fr_2fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-amber-500 text-navy-900">
                <GraduationCap size={18} />
              </span>
              <span className="font-serif text-lg font-semibold text-white">St. Thomas Convent</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              Inspiring minds and shaping futures through quality CBSE education, from Nursery
              through Class XII, since 2010.
            </p>

            <div className="mt-6 space-y-2.5 text-sm text-white/60">
              <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> St. Thomas Convent Hr. Sec. School, Indore, MP</p>
              <p className="flex items-center gap-2"><Clock size={14} className="shrink-0" /> 8:00 AM – 3:00 PM, Mon–Sat</p>
              <p className="flex items-center gap-2 text-amber-400/90"><ShieldAlert size={14} className="shrink-0" /> Emergency: +91 98765 43299</p>
            </div>

            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#top"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-amber-400 hover:text-amber-400"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-bold uppercase tracking-wide text-white/40">{col.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-white/65 hover:text-white">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Newsletter</p>
            <p className="mt-4 text-sm text-white/60">Get admission updates, holiday notices and event reminders in your inbox.</p>
            <NewsletterForm />

            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              <iframe
                title="Campus map"
                src="https://maps.google.com/maps?q=St+Thomas+Convent+School+Indore&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="block h-[120px] w-full grayscale"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} St. Thomas Convent Hr. Sec. School. All rights reserved.</p>
          <p>Office hours: 8:00 AM – 3:00 PM, Monday–Saturday</p>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="mt-3 text-sm font-semibold text-amber-400">Thanks — you're subscribed!</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="mt-3 flex items-center gap-2"
    >
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Subscribe to newsletter"
        className="btn-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-navy-900 hover:bg-amber-600"
      >
        <Send size={15} />
      </button>
    </form>
  );
}
