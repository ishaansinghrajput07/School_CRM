import { useEffect, useState } from "react";
import { IndianRupee, Download, BookOpen, ClipboardCheck, Library, Shirt, Bus, Wallet } from "lucide-react";
import { publicApi, feeStructuresApi, galleryApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import { Shimmer } from "../ui/Skeleton";
import ParallaxDecor from "./ParallaxDecor";

const FEE_ICONS = {
  tuition: BookOpen,
  admission: ClipboardCheck,
  books: Library,
  uniform: Shirt,
  transport: Bus,
};
const iconFor = (feeType) => {
  const key = Object.keys(FEE_ICONS).find((k) => feeType.toLowerCase().includes(k));
  return FEE_ICONS[key] || Wallet;
};

export default function AdmissionsFees() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidePhoto, setSidePhoto] = useState(null);

  useEffect(() => {
    publicApi.classes().then(({ data }) => {
      setClasses(data.classes);
      if (data.classes.length > 0) setSelectedClass(data.classes[0]._id);
    });
    // Uses a real admin-uploaded "academics" photo if one exists - never a
    // stock photo. Falls back to a single-column layout if none yet.
    galleryApi.public("academics").then(({ data }) => {
      if (data.photos.length > 0) setSidePhoto(data.photos[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    feeStructuresApi
      .public(selectedClass)
      .then(({ data }) => setStructures(data.feeStructures))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const bySemester = structures.reduce((acc, f) => {
    const key = f.semester || "one_time";
    acc[key] = acc[key] || [];
    acc[key].push(f);
    return acc;
  }, {});
  const semesterKeys = Object.keys(bySemester).sort((a, b) => (a === "one_time" ? 1 : b === "one_time" ? -1 : a - b));
  const grandTotal = structures.reduce((sum, f) => sum + f.amount, 0);
  const selectedClassName = classes.find((c) => c._id === selectedClass)?.name || "";

  return (
    <section id="admissions" className="relative overflow-hidden bg-white py-20">
      <ParallaxDecor tone="teal" />
      <div className="mx-auto max-w-site px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-700">Admissions 2026-27</p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Fee Structure</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-500">Transparent, semester-wise fees - no hidden costs.</p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {classes.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedClass(c._id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                selectedClass === c._id
                  ? "bg-navy-900 text-white shadow-md"
                  : "bg-paper text-navy-500 hover:bg-navy-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-navy-900/10 bg-white">
            <Shimmer className="h-10 w-full !rounded-none" />
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Shimmer className="h-4 w-32" />
                  <Shimmer className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        )}
        {!loading && structures.length === 0 && (
          <p className="text-center text-sm text-navy-400">Fee structure for this class hasn't been published yet - contact the office for details.</p>
        )}

        {!loading && structures.length > 0 && (
          <div className={`mx-auto ${sidePhoto ? "grid max-w-4xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center" : "max-w-xl"}`}>
            <div>
              <div id="fee-structure-card" className="premium-card overflow-hidden rounded-2xl border-2 border-navy-900/10 bg-white shadow-md">
                {structures.some((fee) => /sample/i.test(fee.feeType)) && (
                  <p role="note" className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-900">
                    Sample amounts for demonstration only — these are not official school fees. Please confirm current fees with the school office.
                  </p>
                )}
                <p className="bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">
                  {selectedClassName} — Annual Fee Details
                </p>
                {semesterKeys.map((key) => (
                  <div key={key} className="border-b border-navy-100 last:border-0">
                    {semesterKeys.length > 1 && (
                      <p className="bg-navy-50/60 px-6 py-2 text-xs font-bold uppercase tracking-wide text-navy-400">
                        {key === "one_time" ? "One-time / Annual" : `Semester ${key}`}
                      </p>
                    )}
                    {bySemester[key].map((f) => {
                      const Icon = iconFor(f.feeType);
                      return (
                        <div key={f._id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                          <span className="flex items-center gap-2.5 text-navy-700">
                            <Icon size={15} className="text-amber-600" /> {f.feeType}
                          </span>
                          <span className="flex items-center font-semibold text-navy-900">
                            <IndianRupee size={13} />{f.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center justify-between bg-navy-900 px-6 py-4">
                  <span className="font-semibold text-white">Total (Annual)</span>
                  <span className="flex items-center font-serif text-lg font-semibold text-white">
                    <IndianRupee size={16} />{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Scopes window.print() to just the fee card via a
                  // temporary body class (see index.css) - without this,
                  // "Download PDF" would print the entire homepage: navbar,
                  // hero, gallery, footer, all of it.
                  document.body.classList.add("printing-fee-structure");
                  window.print();
                  const cleanup = () => {
                    document.body.classList.remove("printing-fee-structure");
                    window.removeEventListener("afterprint", cleanup);
                  };
                  window.addEventListener("afterprint", cleanup);
                }}
                className="btn-glow mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-navy-900/15 px-6 py-3 text-sm font-semibold text-navy-800 hover:bg-paper lg:w-auto"
              >
                <Download size={15} /> Download Fee Structure PDF
              </button>
              <p className="mt-2 text-xs text-navy-400">*Fees are subject to change as per school policy.</p>
            </div>

            {sidePhoto && (
              <div className="rotate-1 overflow-hidden rounded-2xl border-2 border-navy-900 shadow-[8px_8px_0_0_rgba(30,58,95,0.1)]">
                <img
                  src={resolveFileUrl(sidePhoto.imageUrl)}
                  alt={sidePhoto.caption || "Students at St. Thomas Convent"}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}