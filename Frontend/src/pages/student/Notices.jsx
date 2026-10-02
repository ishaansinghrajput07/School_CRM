import { useEffect, useState } from "react";
import { noticesApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import NoticeCard from "../../components/shared/NoticeCard";
import { NoticeCardSkeleton } from "../../components/ui/Skeleton";
import MotivationalQuote from "../../components/shared/MotivationalQuote";

// Groups shown in a fixed order so a Principal's announcement always reads
// as more "official" than a general school notice, with the student's own
// class teacher's notices kept clearly separate from both.
const SECTIONS = [
  { key: "principal", title: "From the Principal's Desk" },
  { key: "class_teacher", title: "From Your Class Teacher" },
  { key: "school", title: "School Notices" },
];

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noticesApi
      .list({ activeOnly: true })
      .then(({ data }) => setNotices(data.notices))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Notice Board" description="Announcements from the school" />
      <MotivationalQuote className="mb-6" />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <NoticeCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && notices.length === 0 && <p className="text-sm text-navy-400">No notices at this time.</p>}

      {!loading &&
        SECTIONS.map(({ key, title }) => {
          const group = notices.filter((n) => (n.source || "school") === key);
          if (group.length === 0) return null;
          return (
            <div key={key} className="mb-6">
              <h3 className="mb-3 font-display text-sm font-semibold text-navy-500">{title}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((n) => <NoticeCard key={n._id} notice={n} />)}
              </div>
            </div>
          );
        })}
    </div>
  );
}
