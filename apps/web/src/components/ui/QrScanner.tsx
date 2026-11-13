'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

/** Minimal type for the browser's built-in BarcodeDetector (Chrome/Edge/Android; not Safari yet) */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

const noop = () => () => {};
/** Can this browser scan QR codes? false on the server, so the first render matches (no hydration error) */
export function useCanScanQr(): boolean {
  return useSyncExternalStore(
    noop,
    () => 'BarcodeDetector' in window,
    () => false,
  );
}

/**
 * Camera QR scanner (back camera on phones). Uses the browser's BarcodeDetector — no library.
 * Calls `onResult` once with the decoded text, then stops the camera.
 */
export function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations('Scanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const supported = typeof window !== 'undefined' && !!window.BarcodeDetector;
  const [denied, setDenied] = useState(false);
  const error = !supported ? t('unsupported') : denied ? t('denied') : null;
  const resultRef = useRef(onResult);
  useEffect(() => {
    resultRef.current = onResult;
  });

  useEffect(() => {
    if (!window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((track) => track.stop());
        stream = s;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play();
        const scan = async () => {
          if (stopped) return;
          try {
            const [code] = await detector.detect(video);
            if (code?.rawValue) {
              stopped = true;
              resultRef.current(code.rawValue);
              return;
            }
          } catch {
            /* frame not ready yet */
          }
          timer = window.setTimeout(scan, 250);
        };
        void scan();
      })
      .catch(() => setDenied(true));

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl bg-navy text-white">
      <div className="relative aspect-square w-full max-w-[420px] sm:aspect-video sm:max-w-none">
        {error ? (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">
            {error}
          </p>
        ) : (
          <>
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            {/* Aim frame */}
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(17,55,95,0.45)]"
            />
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="text-white/80">{error ? '' : t('hint')}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/15 px-4 py-1.5 font-semibold hover:bg-white/25"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
