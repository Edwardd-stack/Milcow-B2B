'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useChatContext } from '@/components/ai/ChatProvider';
import { ArrowUpIcon } from '@/components/icons';

const SHOW_AFTER_PX = 400;

/** Bottom-right "back to top" button, stacked above the AI chat button. Appears after scrolling a bit, scrolls smoothly to the top. */
export function ScrollToTop() {
  const t = useTranslations('Common');
  const [scrolled, setScrolled] = useState(false);
  const { isOpen: chatOpen } = useChatContext();
  // Hidden while the chat window is open (it would peek out from behind it)
  const visible = scrolled && !chatOpen;

  // Subscribing to an external event → setState in the callback is fine
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t('backToTop')}
      title={t('backToTop')}
      tabIndex={visible ? 0 : -1}
      className={`group fixed right-[19px] bottom-[90px] z-40 grid h-14 w-14 place-items-center rounded-full bg-white text-brand shadow-[0_12px_30px_rgba(17,55,95,0.25)] ring-1 ring-brand/10 transition duration-300 hover:bg-brand hover:text-white sm:right-[35px] sm:bottom-[106px] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUpIcon className="h-5 w-5 transition duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
