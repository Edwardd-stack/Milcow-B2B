'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** A QR code image for `value` (made in the browser — no external service sees the data) */
export function QrCode({
  value,
  size = 160,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: '#11375f', light: '#ffffff' },
    })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src)
    return (
      <div
        className={`animate-pulse rounded-xl bg-cream ${className}`}
        style={{ width: size, height: size }}
      />
    );
  // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimise
  return <img src={src} alt="" width={size} height={size} className={`rounded-xl ${className}`} />;
}
