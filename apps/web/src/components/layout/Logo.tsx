import Image from 'next/image';
import { Link } from '@/i18n/navigation';

/** Milcow logo (white wordmark + blue splash) — made for blue backgrounds */
export function Logo({ className = 'h-14 w-auto sm:h-16' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Milcow" className="inline-flex shrink-0">
      <Image
        src="/images/logo.webp"
        alt="Milcow"
        // width/height = the file's real size (keeps the aspect ratio, prevents layout shift).
        // The size on screen is set by className (h-14 = 56px, sm:h-16 = 64px).
        width={480}
        height={206}
        priority
        className={className}
      />
    </Link>
  );
}
