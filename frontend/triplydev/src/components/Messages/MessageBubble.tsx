import {ChatMessage} from "@/src/components/Assistant/Assistant";


export default function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                    isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                }`}
            >
                {message.content}
            </div>
        </div>
    );
}
