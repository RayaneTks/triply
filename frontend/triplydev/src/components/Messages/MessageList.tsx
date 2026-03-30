import MessageBubble from './MessageBubble';
import { ChatMessage } from '@/src/components/Assistant/Assistant';

interface Props {
    messages: ChatMessage[];
    loading: boolean;
}

export default function MessageList({ messages, loading }: Props) {
    return (
        <div className="space-y-3 pr-2">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading ? <div className="text-sm text-white/60">Triply prepare sa reponse...</div> : null}
        </div>
    );
}
