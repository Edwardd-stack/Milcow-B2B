'use client';

import { useSyncExternalStore } from 'react';

/** Tiny toast store: any component can call toast('…'); <Toaster /> shows them. */
interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, tone: Toast['tone'] = 'info') {
  const id = nextId++;
  toasts = [...toasts.slice(-3), { id, text, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4500);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const EMPTY: Toast[] = [];

const TONE: Record<Toast['tone'], string> = {
  info: 'bg-navy text-white',
  success: 'bg-[#2f8f4e] text-white',
  error: 'bg-[#b42318] text-white',
};

export function Toaster() {
  const list = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-24 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {list.map((t) => (
        <p
          key={t.id}
          className={`animate-pop rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_14px_34px_rgba(17,55,95,0.25)] ${TONE[t.tone]}`}
        >
          {t.text}
        </p>
      ))}
    </div>
  );
}
