import { useEffect, useState } from "react";
import { Clock, MapPin, BookOpen } from "lucide-react";
import { examsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import { Shimmer } from "../../components/ui/Skeleton";
import MotivationalQuote from "../../components/shared/MotivationalQuote";

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examsApi.list().then(({ data }) => setExams(data.exams)).finally(() => setLoading(false));
  }, []);

  const today = new Date().setHours(0, 0, 0, 0);
  const upcoming = exams.filter((e) => new Date(e.date).setHours(0, 0, 0, 0) >= today);
  const past = exams.filter((e) => new Date(e.date).setHours(0, 0, 0, 0) < today);

  return (
    <div>
      <PageHeader title="Exams & Tests" description="Your upcoming test and exam schedule" />
      <MotivationalQuote className="mb-6" />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Shimmer key={i} className="h-20 w-full" />)}
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-navy-400">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((ex) => (
                <div key={ex._id} className="card flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-violet-500">
                  <div>
                    <span className="badge bg-violet-50 text-violet-700 capitalize">{ex.examType.replace(/_/g, " ")}</span>
                    <h3 className="mt-1.5 font-display font-semibold text-navy-900">{ex.name}</h3>
                    <p className="text-sm text-navy-500 inline-flex items-center gap-1"><BookOpen size={13} /> {ex.subject?.name}</p>
                  </div>
                  <div className="text-right text-sm text-navy-500">
                    <p className="font-semibold text-navy-800">{new Date(ex.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                    {ex.startTime && <p className="inline-flex items-center gap-1"><Clock size={12} /> {ex.startTime}{ex.endTime ? `-${ex.endTime}` : ""}</p>}
                    {ex.room && <p className="inline-flex items-center gap-1"><MapPin size={12} /> Room {ex.room}</p>}
                  </div>
                  {ex.syllabus && <p className="w-full text-xs text-navy-400 border-t border-navy-50 pt-2 mt-1">Syllabus: {ex.syllabus}</p>}
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-navy-400">No upcoming exams scheduled. Enjoy the breather!</p>}
            </div>
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-navy-400">Past</h2>
              <div className="space-y-2">
                {past.map((ex) => (
                  <div key={ex._id} className="card flex items-center justify-between opacity-70">
                    <div>
                      <p className="font-medium text-navy-700">{ex.name}</p>
                      <p className="text-xs text-navy-400">{ex.subject?.name}</p>
                    </div>
                    <p className="text-xs text-navy-400">{new Date(ex.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
