import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Check, Loader2, CalendarX } from "lucide-react";
import toast from "react-hot-toast";
import { eventsApi } from "../../api/endpoints";
import { getSocket, joinEventRoom, leaveEventRoom } from "../../api/socket";
import { Shimmer } from "../ui/Skeleton";

const CATEGORY_COLORS = {
  academic: "bg-navy-50 text-navy-600",
  sports: "bg-teal-50 text-teal-700",
  cultural: "bg-violet-50 text-violet-700",
  workshop: "bg-amber-50 text-amber-700",
  other: "bg-slate-100 text-slate-600",
};

export default function EventsList() {
  const [events, setEvents] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    eventsApi
      .list({ upcoming: "true" })
      .then(({ data }) => setEvents(data.events))
      .catch(() => setEvents([]));

  useEffect(() => {
    load();
  }, []);

  // Join every visible event's room so the seat count updates live while
  // this page is open, and leave them again on unmount/re-fetch.
  useEffect(() => {
    if (!events?.length) return;
    const socket = getSocket();
    events.forEach((e) => joinEventRoom(e._id));

    const onCount = ({ eventId, registeredCount, capacity }) => {
      setEvents((prev) => prev?.map((e) => (e._id === eventId ? { ...e, registeredCount, capacity } : e)));
    };
    socket?.on("event:count", onCount);

    return () => {
      events.forEach((e) => leaveEventRoom(e._id));
      socket?.off("event:count", onCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events?.length]);

  const toggleRegister = async (event) => {
    setBusyId(event._id);
    try {
      if (event.isRegistered) {
        await eventsApi.cancel(event._id);
        toast.success("Registration cancelled");
      } else {
        await eventsApi.register(event._id);
        toast.success("You're registered!");
      }
      setEvents((prev) => prev.map((e) => (e._id === event._id ? { ...e, isRegistered: !e.isRegistered, registeredCount: e.registeredCount + (e.isRegistered ? -1 : 1) } : e)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  if (events === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-navy-100 bg-white p-5">
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="mt-3 h-3 w-1/2" />
            <Shimmer className="mt-4 h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-white py-16 text-center">
        <CalendarX size={32} className="text-navy-300" />
        <p className="mt-3 font-medium text-navy-600">No upcoming events</p>
        <p className="mt-1 text-sm text-navy-400">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((e, i) => {
        const full = e.capacity && e.registeredCount >= e.capacity && !e.isRegistered;
        const deadlinePassed = e.registrationDeadline && new Date() > new Date(e.registrationDeadline);
        return (
          <motion.div
            key={e._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex flex-col rounded-2xl border border-navy-100 bg-white p-5 shadow-card"
          >
            <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>{e.category}</span>
            <h3 className="mt-2.5 font-display text-base font-semibold text-navy-900">{e.title}</h3>
            {e.description && <p className="mt-1 line-clamp-2 text-sm text-navy-400">{e.description}</p>}

            <div className="mt-3 space-y-1.5 text-xs text-navy-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-navy-300" />
                {new Date(e.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              {(e.startTime || e.endTime) && (
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-navy-300" /> {[e.startTime, e.endTime].filter(Boolean).join(" - ")}
                </div>
              )}
              {e.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-navy-300" /> {e.location}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-navy-300" />
                {e.registeredCount} registered{e.capacity ? ` / ${e.capacity} seats` : ""}
              </div>
            </div>

            <button
              onClick={() => toggleRegister(e)}
              disabled={busyId === e._id || (full && !e.isRegistered) || (deadlinePassed && !e.isRegistered)}
              className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                e.isRegistered ? "bg-teal-50 text-teal-700 hover:bg-red-50 hover:text-red-600" : "bg-navy-800 text-white hover:bg-navy-900"
              }`}
            >
              {busyId === e._id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : e.isRegistered ? (
                <>
                  <Check size={15} /> Registered - tap to cancel
                </>
              ) : full ? (
                "Event full"
              ) : deadlinePassed ? (
                "Registration closed"
              ) : (
                "Register"
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
