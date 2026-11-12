'use client';

import { useChatContext } from './ChatProvider';

/** Any button that opens the floating AI chat (e.g. the CTA "Start AI chat") */
export function OpenChatButton({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { setOpen } = useChatContext();
  return (
    <button type="button" onClick={() => setOpen(true)} className={className}>
      {children}
    </button>
  );
}
