import { useEffect, useState } from "react";
import { Calendar, PartyPopper, Megaphone, Umbrella } from "lucide-react";
import { noticesApi } from "../../api/endpoints";
import useReveal from "../../hooks/useReveal";
import ParallaxDecor from "./ParallaxDecor";

const CATEGORY_META = {
  event: { icon: PartyPopper, tone: "bg-violet-100 text-violet-700", label: "Event" },
  holiday: { icon: Umbrella, tone: "bg-teal-100 text-teal-700", label: "Holiday" },
  general: { icon: Megaphone, tone: "bg-amber-100 text-amber-700", label: "Notice" },
};

export default function NoticesEvents() {
  const headRef = useReveal();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noticesApi.public().then(({ data }) => setNotices(data.notices)).catch(() => setNotices([])).finally(() => setLoading(false));
  }, []);

  if (!loading && notices.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white px-6 py-20">
      <ParallaxDecor tone="amber" />
      <div className="relative mx-auto max-w-[1400px]">
        <div ref={headRef} className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Stay in the loop</span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Notices &amp; Events</h2>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-navy-900/10 bg-paper/60" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notices.map((n, i) => {
              const meta = CATEGORY_META[n.category] || CATEGORY_META.general;
              const Icon = meta.icon;
              return (
                <NoticeCard key={n._id} notice={n} meta={meta} Icon={Icon} delay={i * 90} />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function NoticeCard({ notice, meta, Icon, delay }) {
  const ref = useReveal(delay);
  const date = notice.eventDate ? new Date(notice.eventDate) : null;

  return (
    <div ref={ref} className="reveal premium-card rounded-2xl border border-navy-900/10 bg-paper/60 p-5">
      <div className="flex items-center justify-between">
        <span className={`premium-icon inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
          <Icon size={12} /> {meta.label}
        </span>
        {date && (
          <span className="flex items-center gap-1 text-xs font-medium text-navy-400">
            <Calendar size={12} />
            {date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-serif text-base font-semibold text-navy-900">{notice.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-navy-500">{notice.content}</p>
    </div>
  );
}