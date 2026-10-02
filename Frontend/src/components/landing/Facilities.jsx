import { useEffect, useState } from "react";
import {
  FlaskConical,
  Monitor,
  Trophy,
  Palette,
  Bus,
  Utensils,
  Library,
  Users,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Landmark,
  BookOpenCheck,
} from "lucide-react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";
import { galleryApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import useCountUpOnView from "../../hooks/useCountUpOnView";

const FACILITIES = [
  { icon: FlaskConical, title: "Science Laboratories", body: "Fully equipped Physics, Chemistry and Biology labs with modern instruments for hands-on learning." },
  { icon: Monitor, title: "Computer Lab & Smart Classes", body: "State-of-the-art computer lab with 60+ systems and smart classrooms with interactive boards." },
  { icon: Trophy, title: "Sports Complex", body: "Sprawling playground with a cricket pitch, basketball court, badminton courts and athletics track." },
  { icon: Palette, title: "Arts & Culture", body: "Dedicated rooms for music, dance, drama and fine arts to nurture every child's creative talents." },
  { icon: Bus, title: "Transport Facility", body: "A fleet of GPS-enabled buses covering all major routes with trained drivers and attendants." },
  { icon: Utensils, title: "Hygienic Canteen", body: "Nutritious mid-day meals and a clean canteen serving healthy snacks and beverages." },
  { icon: Library, title: "Library & Reading Room", body: "15,000+ books, digital resources, periodicals and a quiet reading space for students." },
  { icon: Users, title: "Experienced Faculty", body: "80+ qualified and experienced teachers committed to every student's success and growth." },
];

// Counted stats get an animated counter; the rest are simple icon+label chips.
const STATS = [
  { icon: Monitor, value: "35", label: "Smart Classrooms" },
  { icon: FlaskConical, value: "5", label: "Science Labs" },
  { icon: Monitor, value: "2", label: "Computer Labs" },
  { icon: Dumbbell, value: null, label: "Indoor Sports" },
  { icon: Landmark, value: null, label: "Outdoor Stadium" },
  { icon: BookOpenCheck, value: null, label: "Digital Library" },
];

const SLIDE_MS = 5000;

export default function Facilities() {
  const headRef = useReveal();
  const sliderRef = useReveal();
  const [photos, setPhotos] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    galleryApi.public().then(({ data }) => setPhotos(data.photos.slice(0, 8)));
  }, []);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % photos.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <section id="facilities" className="relative overflow-hidden bg-paper px-6 py-24">
      <ParallaxDecor tone="navy" />
      <div className="mx-auto max-w-site">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">What We Offer</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            Facilities & Infrastructure
          </h2>
          <p className="mt-3 text-navy-600">World-class amenities to ensure the best learning environment for our students.</p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-5 sm:grid-cols-2">
            {FACILITIES.map((f, i) => (
              <FacilityCard key={f.title} {...f} delay={(i % 4) * 80} />
            ))}
          </div>

          <div ref={sliderRef} className="reveal">
            {photos.length > 0 && (
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-navy-900/10 shadow-lg">
                {photos.map((p, i) => (
                  <img
                    key={p._id}
                    src={resolveFileUrl(p.imageUrl)}
                    alt={p.caption || p.title || "Campus facility"}
                    loading="lazy"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
                {photos.some((photo) => photo.title?.startsWith("SAMPLE:")) && (
                  <span role="note" className="absolute left-3 top-3 rounded-full bg-amber-100/95 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                    Sample photos
                  </span>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActive((i) => (i + 1) % photos.length)}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          aria-label={`Show photo ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-navy-900/10 bg-white p-6">
              {STATS.map((s) => (
                <StatChip key={s.label} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FacilityCard({ icon: Icon, title, body, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal premium-card rounded-2xl border border-navy-900/10 bg-white p-6">
      <span className="premium-icon flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-navy-900">
        <Icon size={19} />
      </span>
      <h3 className="mt-4 font-serif text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">{body}</p>
    </div>
  );
}

function StatChip({ icon: Icon, value, label }) {
  const [ref, display] = useCountUpOnView(value ?? "");
  return (
    <div ref={ref} className="text-center">
      <Icon size={18} className="mx-auto text-teal-700" />
      {value != null && <p className="mt-1.5 font-serif text-lg font-bold text-navy-900">{display}</p>}
      <p className={`text-[11px] leading-tight text-navy-500 ${value == null ? "mt-2" : "mt-0.5"}`}>{label}</p>
    </div>
  );
}