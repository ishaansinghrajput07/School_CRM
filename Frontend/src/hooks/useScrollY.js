import { useEffect, useRef, useState } from "react";

// Returns the current window scroll position, updated via a single
// requestAnimationFrame-throttled listener (not one listener per component -
// components just read the shared value each render). Returns 0 forever if
// the user has prefers-reduced-motion set, so nothing moves for them.
export default function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrollY;
}
