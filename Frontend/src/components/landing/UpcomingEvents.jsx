import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, FlaskConical, Trophy, Palette, Wrench, PartyPopper, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";
import { eventsApi } from "../../api/endpoints";

const CATEGORY_ICON = {
  academic: FlaskConical,
  sports: Trophy,
  cultural: Palette,
  workshop: Wrench,
  other: PartyPopper,
};

export default function UpcomingEvents() {
  const headRef = useReveal();
  const [events, setEvents] = useState(null); // null = loading

  useEffect(() => {
    eventsApi
      .publicList()
      .then(({ data }) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  // Nothing to show → don't render an empty section on the public site
  if (events !== null && events.length === 0) return null;

  return (
    <section id="events" className="relative overflow-hidden bg-white px-6 py-24">
      <ParallaxDecor tone="violet" />
      <div className="relative mx-auto max-w-[1560px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Mark Your Calendar</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Upcoming Events</h2>
          <p className="mt-3 text-navy-600">Fairs, workshops and celebrations happening on campus this year.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events === null
            ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
            : events.map((e, i) => <EventCard key={e._id} event={e} delay={(i % 3) * 90} />)}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, delay }) {
  const ref = useReveal(delay);
  const Icon = CATEGORY_ICON[event.category] || PartyPopper;

  return (
    <div ref={ref} className="reveal premium-card rounded-2xl border border-navy-900/10 bg-paper/60 p-6">
      <span className="premium-icon flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-white shadow-md">
        <Icon size={19} />
      </span>
      <h3 className="mt-4 font-serif text-base font-semibold text-navy-900">{event.title}</h3>
      {event.description && <p className="mt-1 line-clamp-2 text-xs text-navy-500">{event.description}</p>}

      <div className="mt-3 space-y-1.5 text-xs text-navy-500">
        <p className="flex items-center gap-1.5">
          <Calendar size={12} /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        {(event.startTime || event.endTime) && (
          <p className="flex items-center gap-1.5">
            <Clock size={12} /> {[event.startTime, event.endTime].filter(Boolean).join(" - ")}
          </p>
        )}
        {event.location && (
          <p className="flex items-center gap-1.5">
            <MapPin size={12} /> {event.location}
          </p>
        )}
      </div>

      {/* Registering requires a portal login (student/teacher/parent) - this
          links there rather than faking a registration for a signed-out
          visitor, since the real seat-limited registration lives behind auth. */}
      <Link
        to="/login"
        className="btn-glow mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
      >
        <LogIn size={14} /> Login to Register
      </Link>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-navy-900/10 bg-paper/60 p-6">
      <div className="h-11 w-11 animate-pulse rounded-full bg-navy-900/10" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-navy-900/10" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-1/2 animate-pulse rounded bg-navy-900/10" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-navy-900/10" />
      </div>
      <div className="mt-5 h-10 w-full animate-pulse rounded-full bg-navy-900/10" />
    </div>
  );
}
