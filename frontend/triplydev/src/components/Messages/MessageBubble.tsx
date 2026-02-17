'use client';

import { ChatMessage } from '@/src/components/Assistant/Assistant';

interface MessageBubbleProps {
    message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div
            className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                isUser
                    ? 'ml-auto bg-[var(--primary)]/20 border border-[var(--primary)]/30'
                    : 'mr-auto bg-white/10 border border-white/10'
            }`}
            style={{ color: 'var(--foreground, #ededed)' }}
        >
            {message.content}
        </div>
    );
}
