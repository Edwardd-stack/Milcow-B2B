'use client';

import { createContext, useContext, useState } from 'react';
import { useLocale } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { useChat } from '@/hooks/useChat';

type ChatContextValue = ReturnType<typeof useChat> & {
  /** Floating chat window open/closed */
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * One conversation for the whole site: the home AI section and the floating chat window
 * read the same messages, so a question asked in one place shows up in the other.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as Locale;
  const chat = useChat(locale);
  const [isOpen, setOpen] = useState(false);

  return (
    <ChatContext.Provider value={{ ...chat, isOpen, setOpen }}>{children}</ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used inside <ChatProvider>');
  return ctx;
}
