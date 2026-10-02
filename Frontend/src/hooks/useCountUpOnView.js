import { useEffect, useRef, useState } from "react";

// Animates a number counting up to `target` once the returned ref scrolls
// into view (fires once, via IntersectionObserver). `target` can include a
// non-numeric prefix/suffix (e.g. "1,200+", "15+", "CBSE") - only the
// numeric part animates; a purely non-numeric value like "CBSE" is left
// exactly as-is with no animation.
export default function useCountUpOnView(target, duration = 1400) {
  const ref = useRef(null);
  const [display, setDisplay] = useState("0");
  const started = useRef(false);

  useEffect(() => {
    const match = String(target).match(/^([\d,]+)(.*)$/);
    if (!match) {
      setDisplay(target); // e.g. "CBSE" - nothing numeric to animate
      return;
    }

    const numericTarget = parseInt(match[1].replace(/,/g, ""), 10);
    const suffix = match[2];
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        if (prefersReducedMotion) {
          setDisplay(target);
          return;
        }

        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const current = Math.round(numericTarget * eased);
          setDisplay(current.toLocaleString("en-IN") + suffix);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, display];
}
