import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Download, Baby, Backpack, Puzzle, FlaskConical, GraduationCap } from "lucide-react";
import { publicApi, syllabusApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import { Shimmer } from "../ui/Skeleton";
import useReveal from "../../hooks/useReveal";

const JOURNEY = [
  { icon: Baby, stage: "Nursery", body: "Play-based learning that builds curiosity and social skills." },
  { icon: Backpack, stage: "Primary", body: "Foundational literacy, numeracy and creative exploration." },
  { icon: Puzzle, stage: "Middle School", body: "Broader subjects, critical thinking and early specialisation." },
  { icon: FlaskConical, stage: "Secondary", body: "Board-focused rigour across sciences, commerce and humanities." },
  { icon: GraduationCap, stage: "Senior Secondary", body: "Stream specialisation and readiness for competitive exams." },
];

export default function AcademicsSyllabus() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [syllabi, setSyllabi] = useState([]);
  const [openSubject, setOpenSubject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicApi.classes().then(({ data }) => {
      setClasses(data.classes);
      if (data.classes.length > 0) setSelectedClass(data.classes[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    setOpenSubject(null);
    syllabusApi
      .public(selectedClass)
      .then(({ data }) => setSyllabi(data.syllabi))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  return (
    <section id="academics" className="bg-paper py-20">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-700">Curriculum</p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Syllabus by Class</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-500">See exactly what your child will learn, subject by subject.</p>
        </div>

        {/* Visual learning journey - Nursery through Senior Secondary */}
        <div className="mb-16 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
          {JOURNEY.map((j, i) => (
            <JourneyStage key={j.stage} {...j} delay={i * 90} isLast={i === JOURNEY.length - 1} />
          ))}
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {classes.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedClass(c._id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                selectedClass === c._id ? "bg-navy-900 text-white" : "bg-white text-navy-500 hover:bg-navy-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mx-auto max-w-3xl space-y-2 rounded-2xl border-2 border-navy-900/10 bg-white p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
                <Shimmer className="h-4 w-2/5" />
              </div>
            ))}
          </div>
        )}

        {!loading && syllabi.length === 0 && (
          <p className="text-center text-sm text-navy-400">Syllabus for this class hasn't been published yet - check back soon.</p>
        )}

        <div className="mx-auto max-w-3xl space-y-8">
          {syllabi.map((s) => (
            <div key={s._id}>
              <div className="mb-3 flex items-center justify-between">
                {syllabi.length > 1 ? (
                  <p className="text-sm font-bold text-teal-700">
                    Semester {s.semester}
                    {s.academicYear ? ` · ${s.academicYear}` : ""}
                  </p>
                ) : <span />}
                {s.fileUrl && (
                  <a
                    href={resolveFileUrl(s.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy-900 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-amber-500"
                  >
                    <Download size={13} /> Download full syllabus
                  </a>
                )}
              </div>
              <div className="divide-y divide-navy-100 rounded-2xl border-2 border-navy-900/10 bg-white shadow-sm">
                {s.subjects.map((sub, i) => {
                  const key = `${s._id}-${i}`;
                  const isOpen = openSubject === key;
                  return (
                    <div key={key}>
                      <button
                        onClick={() => setOpenSubject(isOpen ? null : key)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="flex items-center gap-2.5 font-semibold text-navy-800">
                          <BookOpen size={16} className="text-teal-500" /> {sub.name}
                        </span>
                        <ChevronDown size={16} className={`text-navy-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <ul className="space-y-1.5 px-5 pb-4 pl-11 text-sm text-navy-500">
                          {sub.topics.map((topic, ti) => (
                            <li key={ti} className="list-disc">{topic}</li>
                          ))}
                          {sub.topics.length === 0 && <li className="list-none text-navy-300">Topics coming soon</li>}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              {s.notes && <p className="mt-3 text-sm text-navy-400">{s.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyStage({ icon: Icon, stage, body, delay, isLast }) {
  const ref = useReveal(delay);
  return (
    <div className="flex flex-1 items-center gap-2">
      <div ref={ref} className="reveal premium-card group flex flex-1 flex-col items-center gap-2 rounded-2xl border border-navy-900/10 bg-white px-4 py-5 text-center">
        <span className="premium-icon flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-md">
          <Icon size={19} />
        </span>
        <p className="font-serif text-sm font-semibold text-navy-900">{stage}</p>
        <p className="hidden text-[11px] leading-tight text-navy-500 sm:block">{body}</p>
      </div>
      {!isLast && (
        <ChevronRight size={18} className="hidden shrink-0 text-navy-300 sm:block" aria-hidden />
      )}
    </div>
  );
}
