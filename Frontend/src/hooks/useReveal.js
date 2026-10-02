import { useEffect, useRef } from "react";

/**
 * Adds the `reveal` class + toggles `is-visible` once the element enters
 * the viewport. Pass a stagger index to offset children in a group.
 */
export default function useReveal(delayMs = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--reveal-delay", delayMs ? `${delayMs}ms` : "0ms");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delayMs]);

  return ref;
}
