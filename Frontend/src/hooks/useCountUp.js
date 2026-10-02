import { useEffect, useRef, useState } from "react";

/**
 * Animates a number counting up from 0 to `target` over `duration` ms.
 * Non-numeric values (strings like "12/40") are returned as-is, unanimated.
 */
export default function useCountUp(target, duration = 600) {
  const isNumeric = typeof target === "number" && !Number.isNaN(target);
  const [value, setValue] = useState(isNumeric ? 0 : target);
  const frame = useRef();

  useEffect(() => {
    if (!isNumeric) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;
    const to = target;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setValue(Number.isInteger(to) ? Math.round(current) : Math.round(current * 10) / 10);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, isNumeric]);

  return value;
}
