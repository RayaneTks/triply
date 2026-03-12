'use client';

import { ChatMessage } from '@/src/components/Assistant/Assistant';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
    message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                isUser
                    ? 'ml-auto bg-cyan-500/15 border border-cyan-400/40 text-slate-50'
                    : 'mr-auto bg-slate-900/80 border border-white/10 text-slate-100'
            }`}
        >
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="mb-1 text-base font-semibold" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="mt-2 mb-1 text-sm font-semibold" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="mt-2 mb-1 text-sm font-semibold" {...props} />
                    ),
                    p: ({ node, ...props }) => <p className="mb-1 text-slate-200" {...props} />,
                    ul: ({ node, ...props }) => (
                        <ul className="my-1 list-inside list-disc space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => <li {...props} />,
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold" {...props} />
                    ),
                }}
            >
                {message.content}
            </ReactMarkdown>
        </div>
    );
}
