/**
 * Coloured illustrations for the "How it works" steps (same flat style as ProductIllustration).
 * Pure SVG, ~1 KB each.
 */
const STEP_ART = {
  order: (
    // Shopping cart carrying two milk cartons
    <>
      <rect
        x="15"
        y="10"
        width="8"
        height="12"
        rx="1.5"
        fill="#fff"
        stroke="#9cc3ef"
        strokeWidth="1.2"
      />
      <path d="M15 14h8" stroke="#2065ae" strokeWidth="2" />
      <rect
        x="24"
        y="8"
        width="9"
        height="14"
        rx="1.5"
        fill="#fff"
        stroke="#9cc3ef"
        strokeWidth="1.2"
      />
      <path d="M24 13h9" stroke="#e8583d" strokeWidth="2" />
      <path
        d="M5 8h4l4 18h22l4-14H11"
        fill="none"
        stroke="#2065ae"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M12 22h25" stroke="#2065ae" strokeWidth="2" />
      <circle cx="16" cy="34" r="3.2" fill="#11375f" />
      <circle cx="32" cy="34" r="3.2" fill="#11375f" />
    </>
  ),
  contract: (
    // Document with lines, a signature and a green check badge
    <>
      <path
        d="M10 5h19l9 9v27a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="#fff"
        stroke="#9cc3ef"
        strokeWidth="1.5"
      />
      <path
        d="M29 5v9h9"
        fill="#e6f0fc"
        stroke="#9cc3ef"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 17h12M14 22h18M14 27h14"
        stroke="#b9cde6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 35c2-3 3 2 5-1s3 2 5 0"
        fill="none"
        stroke="#2065ae"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="35" cy="36" r="7" fill="#5f9f45" />
      <path
        d="m31.8 36 2.3 2.3 4.2-4.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  payment: (
    // Blue payment card in front of a light one, with a coin
    <>
      <rect
        x="10"
        y="9"
        width="30"
        height="19"
        rx="3.5"
        fill="#cfe2f8"
        transform="rotate(-8 25 18)"
      />
      <rect x="6" y="15" width="32" height="21" rx="3.5" fill="#3182f6" />
      <rect x="6" y="20" width="32" height="4" fill="#1b64da" />
      <rect x="10" y="28" width="9" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="27" y="27.5" width="7" height="5" rx="1" fill="#ffd34d" />
      <circle cx="38" cy="36" r="6" fill="#ffc83d" stroke="#e5a400" strokeWidth="1.2" />
      <path d="M38 33v6M36 35h4" stroke="#b47d00" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  pickup: (
    // Refrigerated truck with a snowflake on the box
    <>
      <rect
        x="4"
        y="12"
        width="24"
        height="18"
        rx="2"
        fill="#fff"
        stroke="#9cc3ef"
        strokeWidth="1.5"
      />
      <path
        d="M16 15v12M10.8 18l10.4 6M10.8 24l10.4-6"
        stroke="#3b9ad9"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M28 17h7l6 6v7H28Z" fill="#2065ae" />
      <path d="M31 19.5h3.5l3.5 3.5H31Z" fill="#cfe2f8" />
      <rect x="4" y="30" width="37" height="3" rx="1.5" fill="#11375f" />
      <circle cx="12" cy="35" r="3.6" fill="#11375f" stroke="#fff" strokeWidth="1.5" />
      <circle cx="33" cy="35" r="3.6" fill="#11375f" stroke="#fff" strokeWidth="1.5" />
    </>
  ),
} as const;

export type StepKey = keyof typeof STEP_ART;

export function StepIllustration({
  step,
  className = 'h-16 w-16',
}: {
  step: StepKey;
  className?: string;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-2xl bg-white shadow-lg shadow-navy/20 ${className}`}
    >
      <svg viewBox="0 0 44 44" className="h-[72%] w-[72%]" aria-hidden="true">
        {STEP_ART[step]}
      </svg>
    </span>
  );
}
