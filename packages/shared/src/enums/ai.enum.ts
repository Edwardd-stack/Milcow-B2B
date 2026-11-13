export const AiLogType = {
  CHAT: 'CHAT', // RAG chatbot
  CONTRACT: 'CONTRACT', // AI contract assistant
  OPS: 'OPS', // admin ops copilot
} as const;
export type AiLogType = (typeof AiLogType)[keyof typeof AiLogType];
