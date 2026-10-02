import useScrollY from "../../hooks/useScrollY";

// Drop this as the first child of any `position: relative; overflow-hidden`
// section to get 2-3 large, soft, blurred circles that drift slowly as the
// page scrolls (parallax) plus a slow ambient drift animation even at rest.
// Purely decorative - aria-hidden, pointer-events-none, never affects layout.
export default function ParallaxDecor({ tone = "amber" }) {
  const scrollY = useScrollY();

  const colors = {
    amber: ["bg-amber-200/30", "bg-teal-200/25"],
    teal: ["bg-teal-200/30", "bg-amber-200/20"],
    navy: ["bg-navy-200/20", "bg-amber-200/20"],
    violet: ["bg-violet-200/25", "bg-coral-200/20"],
  }[tone] || ["bg-amber-200/30", "bg-teal-200/25"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`animate-drift absolute -left-24 top-10 h-72 w-72 rounded-full ${colors[0]} blur-3xl`}
        style={{ transform: `translateY(${scrollY * 0.04}px)` }}
      />
      <div
        className={`animate-drift-slow absolute -right-20 bottom-0 h-80 w-80 rounded-full ${colors[1]} blur-3xl`}
        style={{ transform: `translateY(${scrollY * -0.03}px)` }}
      />
    </div>
  );
}
