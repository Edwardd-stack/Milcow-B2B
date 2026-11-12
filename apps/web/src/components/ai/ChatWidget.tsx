'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RobotIcon } from '@/components/icons';
import { ChatPanel } from './ChatPanel';
import { useChatContext } from './ChatProvider';

/** Floating AI chat: round button in the bottom-right corner + the chat window above it. On every page. */
export function ChatWidget() {
  const t = useTranslations('Chat');
  const { isOpen, setOpen } = useChatContext();
  // Orange "new" dot until the visitor opens the chat once
  const [seen, setSeen] = useState(false);
  // "AI 상담" bubble next to the button — only on the first visit
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (readHintSeen()) return;
    const show = setTimeout(() => setHint(true), HINT_DELAY_MS);
    const hide = setTimeout(() => {
      setHint(false);
      saveHintSeen();
    }, HINT_DELAY_MS + HINT_VISIBLE_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // Esc closes the window (subscribing to an external event → setState in the callback is fine)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  const toggle = () => {
    setSeen(true);
    setHint(false);
    saveHintSeen(); // opened once → never show the bubble again
    setOpen(!isOpen);
  };

  return (
    <>
      {/* Window — kept mounted so the scroll position and typed text survive closing */}
      <div
        className={`fixed right-4 bottom-[92px] z-50 w-[min(380px,calc(100vw-2rem))] origin-bottom-right transition duration-300 sm:right-8 sm:bottom-[112px] ${
          isOpen ? 'scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-95 opacity-0'
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <ChatPanel
          onClose={() => setOpen(false)}
          listClassName="h-[min(340px,calc(100svh-400px))] min-h-[160px]"
          className="shadow-[0_24px_60px_rgba(17,55,95,0.28)]"
        />
      </div>

      {/* First-visit hint bubble (clicking it opens the chat) */}
      {hint && !isOpen && (
        <button
          type="button"
          onClick={toggle}
          className="fixed right-[88px] bottom-[26px] z-50 flex animate-pop items-center gap-1.5 rounded-full bg-white py-2.5 pr-4 pl-3.5 text-sm font-semibold whitespace-nowrap text-heading shadow-[0_10px_28px_rgba(17,55,95,0.2)] sm:right-[104px] sm:bottom-[42px]"
        >
          <span className="h-2 w-2 rounded-full bg-[#2fbf71]" aria-hidden="true" />
          {t('hint')}
          <span className="hidden font-normal text-muted sm:inline">· {t('hintMore')}</span>
          {/* little tail pointing at the robot */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-1 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white"
          />
        </button>
      )}

      {/* Button */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? t('close') : t('open')}
        title={isOpen ? t('close') : t('open')}
        className="group fixed right-4 bottom-4 z-50 grid h-[62px] w-[62px] place-items-center rounded-full bg-linear-135 from-brand to-navy text-white shadow-[0_14px_30px_rgba(32,101,174,0.45)] transition duration-300 hover:scale-105 sm:right-8 sm:bottom-8"
      >
        {/* Soft pulse ring — only while closed */}
        {!isOpen && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border-2 border-brand opacity-60 [animation-duration:2.2s] motion-reduce:hidden"
          />
        )}
        {!seen && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent"
          />
        )}
        {isOpen ? (
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <RobotIcon className="h-[30px] w-[30px] group-hover:animate-nod" />
        )}
      </button>
    </>
  );
}

const HINT_KEY = 'milcow:chat-hint-seen';
const HINT_DELAY_MS = 1500;
const HINT_VISIBLE_MS = 6000;

// localStorage can throw (private mode, blocked storage) — the hint is just a nicety
function readHintSeen(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

function saveHintSeen() {
  try {
    window.localStorage.setItem(HINT_KEY, '1');
  } catch {
    /* ignore */
  }
}
