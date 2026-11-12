import type { ChatMessage, ChatResponse, Locale } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface AskChatBody {
  question: string;
  locale: Locale;
  history?: ChatMessage[];
}

/** POST /ai/chat — RAG chatbot (public, rate-limited on the server) */
export function askChat(body: AskChatBody) {
  return apiFetch<ChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(body) });
}
