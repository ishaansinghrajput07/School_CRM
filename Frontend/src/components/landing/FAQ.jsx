import { useState } from "react";
import { ChevronDown } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const FAQS = [
  {
    q: "What is the admission process?",
    a: "Fill out the online inquiry form or visit the school office, submit the required documents, attend a brief interaction (for Class I and above), and receive confirmation within a week. Our admissions team will guide you through each step.",
  },
  {
    q: "What documents are required for admission?",
    a: "Birth certificate, previous school's transfer certificate and report card (if applicable), address proof, and passport-size photographs of the student and parents.",
  },
  {
    q: "Is transport facility available?",
    a: "Yes — GPS-enabled buses cover all major routes across the city with trained drivers and attendants. Routes and stops can be confirmed with the transport office.",
  },
  {
    q: "What is the medium of instruction?",
    a: "English is the medium of instruction across all classes, with Hindi and a third language taught as per the CBSE curriculum.",
  },
  {
    q: "Are scholarships available?",
    a: "Yes, merit-based scholarships are available for outstanding students, along with concessions for siblings and specific categories — ask the admissions office for current criteria.",
  },
];

export default function FAQ() {
  const headRef = useReveal();
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative overflow-hidden bg-white px-6 py-24">
      <ParallaxDecor tone="amber" />
      <div className="mx-auto max-w-3xl">
        <div ref={headRef} className="reveal text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">FAQ</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Admissions, answered</h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-xl border border-navy-900/10">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-serif text-[15px] font-semibold text-navy-900">{f.q}</span>
                <ChevronDown size={18} className={`shrink-0 text-navy-400 transition-transform ${open === i ? "rotate-180 text-amber-600" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-navy-600">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
