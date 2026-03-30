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
            className={`max-w-[84%] rounded-[1.4rem] border px-4 py-3 text-sm leading-relaxed shadow-sm ${
                isUser
                    ? 'ml-auto border-cyan-400/40 bg-cyan-500/15 text-white'
                    : 'mr-auto border-white/10 bg-slate-900/70 text-slate-100'
            }`}
        >
            <ReactMarkdown
                components={{
                    h1: ({ node: _node, ...props }) => <h1 className="mb-1 text-base font-semibold" {...props} />,
                    h2: ({ node: _node, ...props }) => <h2 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
                    h3: ({ node: _node, ...props }) => <h3 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
                    p: ({ node: _node, ...props }) => <p className="mb-1 text-inherit" {...props} />,
                    ul: ({ node: _node, ...props }) => <ul className="my-1 list-inside list-disc space-y-1" {...props} />,
                    li: ({ node: _node, ...props }) => <li {...props} />,
                    strong: ({ node: _node, ...props }) => <strong className="font-semibold" {...props} />,
                }}
            >
                {message.content}
            </ReactMarkdown>
        </div>
    );
}
