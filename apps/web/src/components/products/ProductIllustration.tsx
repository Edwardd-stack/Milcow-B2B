import type { ProductType } from '@milcow/shared';

/**
 * A small coloured illustration per product type (flat style, like the hero card icons).
 * Pure SVG: no image files, sharp on every screen, ~1 KB each.
 */
const ILLUSTRATIONS: Record<ProductType, { bg: string; art: React.ReactNode }> = {
  RAW_MILK: {
    bg: 'bg-[#e6f0fc]',
    art: (
      <>
        <rect x="20" y="6" width="8" height="5" rx="1.5" fill="#2065ae" />
        <path
          d="M19 11h10v5l4 6v18a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V22l4-6Z"
          fill="#fff"
          stroke="#9cc3ef"
          strokeWidth="1.5"
        />
        <path d="M15.8 27h16.4v13a3 3 0 0 1-3 3H18.8a3 3 0 0 1-3-3Z" fill="#cfe2f8" />
        <path
          d="M15.8 27c3-1.6 5.4 1.6 8.2 0s5.2 1.6 8.2 0"
          fill="none"
          stroke="#9cc3ef"
          strokeWidth="1.5"
        />
        <rect x="19" y="31" width="10" height="6" rx="1" fill="#2065ae" />
      </>
    ),
  },
  CREAM: {
    bg: 'bg-[#fdf1e4]',
    art: (
      <>
        <path d="M13 26h22l-2.5 15a3 3 0 0 1-3 2.5H18.5a3 3 0 0 1-3-2.5Z" fill="#f2a96b" />
        <path
          d="M14 26c-2-6 4-9 6-7 0-5 8-6 9-1 4-2 8 3 5 8Z"
          fill="#fff"
          stroke="#f3d3b6"
          strokeWidth="1.5"
        />
        <path d="M22 13c1-3 4-3 4 0 0 2-2 3-3 3" fill="#fff" stroke="#f3d3b6" strokeWidth="1.5" />
        <path d="M16 32h16" stroke="#e08a4a" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  BUTTER: {
    bg: 'bg-[#fff6d8]',
    art: (
      <>
        <ellipse cx="24" cy="38" rx="17" ry="4.5" fill="#e3d6b0" />
        <path d="M10 27 18 19h21v10l-8 8H10Z" fill="#ffd34d" />
        <path d="M10 27h21l8-8" fill="none" stroke="#e6a817" strokeWidth="1.5" />
        <path d="M31 27v10" stroke="#e6a817" strokeWidth="1.5" />
        <path d="M14 23h4" stroke="#fff3c4" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  CHEESE: {
    bg: 'bg-[#fff1cc]',
    art: (
      <>
        <path d="M7 36V24l24-12 10 12v12Z" fill="#ffc83d" />
        <path d="M7 24h34" stroke="#e5a400" strokeWidth="1.5" />
        <path d="M7 24 31 12l10 12" fill="#ffe08a" />
        <circle cx="15" cy="30" r="2.5" fill="#e5a400" />
        <circle cx="26" cy="31.5" r="3" fill="#e5a400" />
        <circle cx="35" cy="28.5" r="1.8" fill="#e5a400" />
        <circle cx="27" cy="19" r="1.5" fill="#f2be3a" />
      </>
    ),
  },
  YOGURT: {
    bg: 'bg-[#fde8ef]',
    art: (
      <>
        <path
          d="M11 16h26l-3 25a3 3 0 0 1-3 2.6H17a3 3 0 0 1-3-2.6Z"
          fill="#fff"
          stroke="#f4b6c9"
          strokeWidth="1.5"
        />
        <rect x="9" y="12" width="30" height="5" rx="2.5" fill="#e75480" />
        <path d="M13.5 26h21l-1.6 13H15.1Z" fill="#f8c7d6" />
        <circle cx="21" cy="31" r="2.2" fill="#e75480" />
        <circle cx="27" cy="33.5" r="1.8" fill="#e75480" />
        <path
          d="M27.5 28.8c.8-1.8 2.6-2 3.4-1"
          stroke="#5f9f45"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
  MILK_POWDER: {
    bg: 'bg-[#eaeff6]',
    art: (
      <>
        <path
          d="M14 12h20l3 28a3 3 0 0 1-3 3.3H14a3 3 0 0 1-3-3.3Z"
          fill="#fff"
          stroke="#b8c7da"
          strokeWidth="1.5"
        />
        <path d="M14 12l2-4h16l2 4" fill="#d6e1ee" />
        <rect x="16" y="22" width="16" height="11" rx="2" fill="#2065ae" />
        <path d="M20 27.5h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M34 37c3-1 6 0 6 2.5s-5 3.5-9 1.5"
          fill="#fdfdfd"
          stroke="#b8c7da"
          strokeWidth="1.2"
        />
      </>
    ),
  },
};

export function ProductIllustration({
  type,
  className = 'h-16 w-16',
}: {
  type: ProductType;
  className?: string;
}) {
  const { bg, art } = ILLUSTRATIONS[type];
  return (
    <span className={`flex items-center justify-center rounded-2xl ${bg} ${className}`}>
      <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]" aria-hidden="true">
        {art}
      </svg>
    </span>
  );
}
