import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Facebook, Instagram, Youtube, QrCode } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";
import schoolBuildingPhoto from "../../assets/hero/hero1.webp";

export default function Contact() {
  const ref = useReveal();
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="relative overflow-hidden bg-paper px-6 py-24">
      <ParallaxDecor tone="navy" />
      <div ref={ref} className="reveal mx-auto max-w-[1560px]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Get in Touch</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">We'd love to meet you</h2>
          <p className="mt-4 text-navy-600">
            Have a question about admissions, fees, or a school visit? Reach out and our office
            will get back to you within one business day.
          </p>
        </div>

        {/* Three-column layout: contact details, the form, and a map/social
            column - so the wide desktop canvas is used instead of leaving
            empty space beside a lone map. */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-start">
          {/* Column 1 - contact info */}
          <div className="rounded-2xl border-2 border-navy-900/10 bg-white p-6 shadow-card">
            <p className="font-serif text-lg font-semibold text-navy-900">Contact Information</p>
            <div className="mt-5 space-y-4">
              <ContactRow icon={Mail} label="admissions@stthomasconvent.edu.in" />
              <ContactRow icon={Phone} label="+91 98765 43210" />
              <ContactRow icon={MapPin} label="St. Thomas Convent Hr. Sec. School, Indore" />
              <ContactRow icon={Clock} label="8:00 AM – 3:00 PM, Mon–Sat" />
            </div>
            <div className="mt-6 border-t border-dashed border-navy-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Office Hours</p>
              <p className="mt-2 text-sm text-navy-600">Monday – Saturday, 8:00 AM to 3:00 PM</p>
              <p className="mt-1 text-sm text-navy-600">Sunday: Closed</p>
            </div>
          </div>

          {/* Column 2 - contact form */}
          <div className="flex flex-col rounded-2xl border-2 border-navy-900/10 bg-white p-6 shadow-card">
            {sent ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <p className="font-serif text-lg font-semibold text-navy-900">Message sent</p>
                <p className="mt-1 text-sm text-navy-500">Our office will reach out within one business day.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="grid gap-4"
              >
                <div>
                  <label className="label">Parent's name</label>
                  <input required className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input required className="input" placeholder="Your phone number" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input required type="email" className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea required rows={4} className="input" placeholder="Tell us how we can help..." />
                </div>
                <button type="submit" className="btn-primary !bg-navy-900 hover:!bg-navy-800">
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Column 3 - map, campus photo, QR code, social */}
          <div className="flex flex-col gap-5">
            <div className="overflow-hidden rounded-2xl border-2 border-navy-900/10 shadow-card">
              <iframe
                title="School location"
                src="https://maps.google.com/maps?q=St+Thomas+Convent+School+Indore&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="block h-[180px] w-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex items-center gap-4 rounded-2xl border-2 border-navy-900/10 bg-white p-4 shadow-card">
              <img src={schoolBuildingPhoto} alt="Campus" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-900">Visit our campus</p>
                <p className="text-xs text-navy-500">Book a guided tour any weekday.</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-navy-900/10 bg-paper text-navy-700">
                <QrCode size={20} />
              </span>
            </div>

            <div className="rounded-2xl border-2 border-navy-900/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Follow Us</p>
              <div className="mt-3 flex items-center gap-3">
                {[Facebook, Instagram, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#top"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-100 text-navy-500 transition-colors hover:border-navy-900 hover:text-navy-900"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
              <a href="tel:+919876543210" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-teal-700">
                <Phone size={14} /> Call the office
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-white text-navy-900">
        <Icon size={16} />
      </span>
      <span className="text-sm font-medium text-navy-700">{label}</span>
    </div>
  );
}
