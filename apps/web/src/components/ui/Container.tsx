/**
 * Page width for every section: max 1280px (Tailwind max-w-7xl = the xl breakpoint),
 * side padding 20px on phones, 32px from 640px up. Change it here → the whole site follows.
 */
export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}
