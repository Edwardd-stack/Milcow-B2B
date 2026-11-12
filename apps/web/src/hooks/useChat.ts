import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ChatMessage, Locale } from '@milcow/shared';
import { askChat } from '@/services/ai.service';

/** The server accepts at most 6 earlier turns (CHAT_MAX_HISTORY) */
const MAX_HISTORY = 6;

/**
 * Chat state for one conversation: the messages on screen + sending a question.
 * useMutation = "a request that changes something / is triggered by the user" (not cached like useQuery).
 */
export function useChat(locale: Locale) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (question: string) =>
      askChat({ question, locale, history: messages.slice(-MAX_HISTORY) }),
    onSuccess: (data) => setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]),
  });

  const send = (question: string) => {
    const text = question.trim();
    if (!text || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]); // show the question at once
    mutation.mutate(text);
  };

  return { messages, send, isPending: mutation.isPending, error: mutation.error };
}
