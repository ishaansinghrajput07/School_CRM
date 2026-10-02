import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "Academics", href: "#academics" },
  { label: "Gallery", href: "#gallery" },
  { label: "Admissions", href: "#admissions" },
  { label: "Parents Say", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tracks which section is currently in view so the nav can highlight it -
  // a plain scroll-position calc rather than N separate observers, since
  // sections are stacked and roughly full-viewport-height already.
  useEffect(() => {
    const sectionIds = LINKS.map((l) => l.href.slice(1));
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`relative z-50 rounded-b-3xl bg-paper transition-shadow duration-300 ${
        scrolled ? "shadow-[0_8px_30px_-12px_rgba(30,58,95,0.35)]" : "shadow-[0_4px_16px_-8px_rgba(30,58,95,0.15)]"
      }`}
    >
      <nav className="relative mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-navy-900 bg-amber-500 text-navy-900">
            <GraduationCap size={19} />
          </span>
          <span className="font-serif text-xl font-semibold text-navy-900">
            St. Thomas <span className="italic text-teal-600">Convent</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-navy-900" : "text-navy-600 hover:text-navy-900"
                }`}
              >
                {l.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-amber-500 transition-all duration-300 ${
                    isActive ? "opacity-100" : "scale-x-0 opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link
              to={`/${user.role}`}
              className="btn-glow rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Go to portal
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
                Portal Login
              </Link>
              <Link
                to="/apply"
                className="btn-glow rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-amber-600"
              >
                Apply for Admission
              </Link>
            </>
          )}
        </div>

        <button className="text-navy-900 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Decorative scalloped notch at bottom-center, with the school crest
          nested in it - purely ornamental, no functional purpose. Sized to
          match the navbar's own background color so it reads as one
          continuous curved edge rather than a separate shape. */}
      <div className="pointer-events-none absolute inset-x-0 top-full hidden -translate-y-px justify-center sm:flex">
        <svg width="120" height="30" viewBox="0 0 120 30" className="text-paper" aria-hidden="true">
          <path d="M0,0 C22,0 30,28 60,28 C90,28 98,0 120,0 Z" fill="currentColor" />
        </svg>
        <span className="absolute left-1/2 top-1 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-navy-900 bg-white shadow-md">
          <GraduationCap size={18} className="text-navy-900" />
        </span>
      </div>

      {open && (
        <div className="mx-4 mt-3 flex flex-col gap-1 rounded-2xl border border-navy-900/10 bg-paper p-4 shadow-lg lg:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active === l.href.slice(1) ? "bg-white text-navy-900" : "text-navy-700 hover:bg-white hover:text-navy-900"
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
           to={user ? `/${user.role}` : "/apply"}
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-navy-900"
          >
            {user ? "Go to portal" : "Apply for Admission"}
          </Link>
        </div>
      )}
    </header>
  );
}