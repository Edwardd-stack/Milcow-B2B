'use client';

import { useEffect, useState } from 'react';

interface RotatingWordProps {
  words: string[];
  /** How long each word stays, in ms */
  interval?: number;
}

/**
 * Swaps words every `interval` ms with a see-saw motion (both ends tip up and down, then settle).
 * All words are stacked in one grid cell, so the line keeps the width of the longest word
 * and the layout never jumps. Screen readers get the full list once.
 */
export function RotatingWord({ words, interval = 1800 }: RotatingWordProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // setState inside a timer callback (not directly in the effect body) — fine for React
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="inline-grid">
      <span className="sr-only">{words.join(', ')}</span>
      {words.map((word, i) => (
        <span
          key={word}
          aria-hidden="true"
          className={`col-start-1 row-start-1 origin-center ${
            i === index ? 'animate-seesaw' : 'invisible'
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
