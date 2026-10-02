import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Expand, ImageOff } from "lucide-react";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import { galleryApi } from "../../api/endpoints";
import { Shimmer } from "../ui/Skeleton";
import ParallaxDecor from "./ParallaxDecor";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "campus", label: "Campus" },
  { key: "events", label: "Events" },
  { key: "sports", label: "Sports" },
  { key: "academics", label: "Academics" },
  { key: "cultural", label: "Cultural" },
  { key: "activities", label: "Activities" },
];

export default function GallerySection() {
  const [category, setCategory] = useState("all");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed

  useEffect(() => {
    setLoading(true);
    galleryApi
      .public(category === "all" ? undefined : category)
      .then(({ data }) => setPhotos(data.photos))
      .finally(() => setLoading(false));
  }, [category]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1)), [photos.length]);
  const showNext = useCallback(() => setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0)), [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const active = lightboxIndex !== null ? photos[lightboxIndex] : null;
  const hasSamplePhotos = photos.some((photo) => photo.title?.startsWith("SAMPLE:"));

  return (
    <section id="gallery" className="relative overflow-hidden bg-paper py-20">
      <ParallaxDecor tone="amber" />
      <div className="mx-auto max-w-site px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-700">Photo Gallery</p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">Glimpses of School Life</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-500">
            {hasSamplePhotos ? "Illustrative preview images across campus and school activities." : "Sports day, annual fest, classrooms and campus - straight from our own students."}
          </p>
          {!loading && hasSamplePhotos && (
            <p role="note" className="mx-auto mt-3 max-w-xl text-sm font-medium text-amber-800">
              Illustrative sample images are displayed. Replace them with actual school photos before publication.
            </p>
          )}
        </div>

        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                category === c.key ? "bg-navy-900 text-white shadow-md" : "bg-white text-navy-500 hover:bg-navy-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mb-6 text-center text-xs text-navy-400">
          {!loading && photos.length > 0 ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "\u00A0"}
        </p>

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} className="aspect-square w-full" />
            ))}
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border-2 border-dashed border-navy-900/15 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-300">
              <ImageOff size={20} />
            </span>
            <p className="mt-3 text-sm font-medium text-navy-500">No photos in this category yet</p>
            <p className="mt-1 text-xs text-navy-400">Check back soon, or explore another category above.</p>
          </div>
        )}

        {/* Uniform grid - every cell the same size (cropped to a square),
            so rows line up evenly instead of the uneven masonry look. */}
        {!loading && photos.length > 0 && (
          <div key={category} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p, i) => (
              <button
                key={p._id}
                onClick={() => setLightboxIndex(i)}
                style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                className="group relative block aspect-square animate-fade-up overflow-hidden rounded-xl border-2 border-navy-900/10 bg-white text-left opacity-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-xl"
              >
                <img
                  src={resolveFileUrl(p.imageUrl)}
                  alt={p.caption || p.title || "School gallery photo"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy-900/0 opacity-0 transition-all duration-300 group-hover:bg-navy-900/50 group-hover:opacity-100">
                  <span className="flex h-10 w-10 -translate-y-2 items-center justify-center rounded-full bg-white text-navy-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Expand size={16} />
                  </span>
                  <span className="translate-y-2 text-xs font-semibold text-white opacity-0 transition-all delay-75 duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    View Image
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/95 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
                aria-label="Previous photo"
                className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-8"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                aria-label="Next photo"
                className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-8"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveFileUrl(active.imageUrl)}
              alt={active.caption || active.title || "School gallery photo"}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
            {(active.caption || active.title) && (
              <p className="mt-3 text-center text-sm text-white/80">{active.caption || active.title}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}