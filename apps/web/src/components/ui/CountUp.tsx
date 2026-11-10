'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  /** Animation length in ms */
  duration?: number;
}

/**
 * Counts from 0 to `to` the first time the number scrolls into view (like the template's counters).
 * IntersectionObserver = "tell me when this element is visible" without listening to every scroll.
 */
export function CountUp({ to, duration = 2000 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // People who turned off animations see the final number at once
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect(); // run once
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // fast start, soft finish
          setValue(Math.round(eased * to));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return <span ref={ref}>{value.toLocaleString('en-US')}</span>;
}
