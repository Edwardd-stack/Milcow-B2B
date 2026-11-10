interface WaveProps {
  /** Tailwind fill class of the NEXT section, e.g. "fill-white", "fill-cream", "fill-navy" */
  fill: string;
  /** "bottom": sits at the bottom edge of a section; "top": at the top edge */
  position?: 'bottom' | 'top';
  className?: string;
}

/**
 * Soft wave between two sections. Shape traced from the Milcow template:
 * low on the left, crest a little right of center, gentle rise at the far right.
 * Put it inside a `relative` section; it overlaps the edge so the colors flow into each other.
 * Height follows the width (aspect ratio), so the curve keeps the same shape on every screen.
 */
export function Wave({ fill, position = 'bottom', className = '' }: WaveProps) {
  // 1px overlap hides the hairline gap browsers leave at fractional pixel sizes
  const place = position === 'bottom' ? '-bottom-px' : '-top-px rotate-180';
  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${place} aspect-[1440/64] w-full ${className}`}
    >
      <path
        className={fill}
        d="M0 42.3C24 44.2 84 53.2 144 53.8C204 54.4 288 51.2 360 45.9C432 40.6 504 29.0 576 22.2C648 15.3 720 5.8 792 4.9C864 3.9 936 11.4 1008 16.4C1080 21.4 1152 34.6 1224 35.1C1296 35.6 1404 21.9 1440 19.3V64H0Z"
      />
    </svg>
  );
}
