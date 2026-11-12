interface WaveProps {
  /** Tailwind fill class of the NEXT section, e.g. "fill-white", "fill-cream", "fill-navy" */
  fill: string;
  /** "bottom": sits at the bottom edge of a section; "top": at the top edge */
  position?: 'bottom' | 'top';
  className?: string;
}

/**
 * Soft wave between two sections. Shape traced from the Milcow template screenshot:
 * low on the left, high crest a little right of center, a dip near 85%, small rise at the far right.
 * Put it inside a `relative` section; it overlaps the edge so the colors flow into each other.
 * Height follows the width (aspect ratio), so the curve keeps the same shape on every screen.
 */
export function Wave({ fill, position = 'bottom', className = '' }: WaveProps) {
  // 1px overlap hides the hairline gap browsers leave at fractional pixel sizes
  const place = position === 'bottom' ? '-bottom-px' : '-top-px rotate-180';
  return (
    <svg
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${place} aspect-[1440/100] w-full ${className}`}
    >
      <path
        className={fill}
        d="M0 65C70 80 150 91 238 91C420 91 600 4 806 4C980 4 1080 54 1224 54C1320 54 1400 32 1440 25V100H0Z"
      />
    </svg>
  );
}
