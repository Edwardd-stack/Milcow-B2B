/** Small inline icons (stroke = currentColor). Original drawings, no icon library needed. */
type IconProps = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export const PhoneIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
);
export const MailIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const PinIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const ClockIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const FarmIcon = ({ className = 'h-6 w-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M3 21V10l9-6 9 6v11" />
    <path d="M9 21v-6h6v6M3 21h18" />
  </svg>
);
export const SnowflakeIcon = ({ className = 'h-6 w-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 4l3 3 3-3M9 20l3-3 3 3" />
  </svg>
);
export const SparkIcon = ({ className = 'h-6 w-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" />
  </svg>
);
export const ArrowRightIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Two-colour illustrations for the hero cards (like the template's coloured icons) */
export const BasketIcon = ({ className = 'h-7 w-7' }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      d="M9 13 13 6M23 13 19 6"
      stroke="#2065ae"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="4" y="12" width="24" height="5" rx="1.5" fill="#2065ae" />
    <path d="M6 17h20l-2 9.5a2 2 0 0 1-2 1.5H10a2 2 0 0 1-2-1.5Z" fill="#9cc3ef" />
    <path d="M12 20v5M16 20v5M20 20v5" stroke="#2065ae" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
export const StoreIcon = ({ className = 'h-7 w-7' }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path d="M5 11 7 5h18l2 6Z" fill="#e8583d" />
    <path
      d="M5 11h22v2a3 3 0 0 1-5.5 1.6A3 3 0 0 1 16 14.6a3 3 0 0 1-5.5 0A3 3 0 0 1 5 13Z"
      fill="#f59e7c"
    />
    <rect x="7" y="16" width="18" height="11" rx="1" fill="#fde2d6" />
    <rect x="10" y="19" width="5" height="8" fill="#e8583d" />
    <rect x="18" y="19" width="4" height="4" rx=".5" fill="#e8583d" />
  </svg>
);

/* About section */
export const DoubleCheckIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m2 13 4 4 8-9M10 16l1 1 9-10" />
  </svg>
);
export const ShopIcon = ({ className = 'h-7 w-7' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.4}>
    <path d="M3 9 5 4h14l2 5M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12v8h14v-8M10 20v-5h4v5" />
  </svg>
);
export const LayersIcon = ({ className = 'h-7 w-7' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.4}>
    <path d="m12 3 9 5-9 5-9-5Z" />
    <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
  </svg>
);

/* One icon per product type (products cards, filters) */
const productTypePaths: Record<string, React.ReactNode> = {
  RAW_MILK: (
    <>
      <path d="M9 3h6v3l2 3v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9l2-3Z" />
      <path d="M7 13h10" />
    </>
  ),
  CREAM: <path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11Z" />,
  BUTTER: (
    <>
      <path d="M3 15 9 9h12v6l-6 6H3Z" />
      <path d="M3 15h12l6-6M15 15v6" />
    </>
  ),
  CHEESE: (
    <>
      <path d="M3 18V11l11-6 7 6v7Z" />
      <path d="M3 11h18" />
      <circle cx="8" cy="15" r="1.2" />
      <circle cx="15" cy="14.5" r="1.6" />
    </>
  ),
  YOGURT: (
    <>
      <path d="M5 8h14l-1.6 11.2a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8Z" />
      <path d="M4 8h16M9 4h6l1 4H8Z" />
    </>
  ),
  MILK_POWDER: (
    <>
      <path d="M6 7h12l1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
      <path d="M8 7V4h8v3M9 13h6" />
    </>
  ),
};

export const ProductTypeIcon = ({ type, className = 'h-7 w-7' }: IconProps & { type: string }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.5}>
    {productTypePaths[type] ?? productTypePaths.RAW_MILK}
  </svg>
);
