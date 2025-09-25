import { askGeminiRequest } from 'apis';
import { useState, ChangeEvent, FormEvent } from 'react';

// 메시지 객체의 타입을 정의합니다.
interface Message {
    text: string;
    sender: 'user' | 'ai';
}

// Custom Hook의 반환 값 타입을 정의합니다.
interface UseChatReturn {
    messages: Message[];
    input: string;
    isLoading: boolean;
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement | HTMLImageElement>) => Promise<void>;
}

export const useChat = (): UseChatReturn => {
    // 채팅 메시지 목록 상태
    const [messages, setMessages] = useState<Message[]>([
        { text: "안녕하세요! 무엇을 도와드릴까요?", sender: 'ai' }
    ]);
    // 사용자 입력 값 상태
    const [input, setInput] = useState<string>('');
    // API 요청 로딩 상태
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // input 값 변경 핸들러
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    // 메시지 전송 핸들러
    const handleSubmit = async (e: FormEvent<HTMLFormElement | HTMLImageElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // 1. 사용자의 메시지를 메시지 목록에 추가
        const userMessage: Message = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. API 호출
            const aiResponseText = await askGeminiRequest({ prompt: input });

            // 3. AI의 응답을 메시지 목록에 추가
            const aiMessage: Message = { text: aiResponseText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = { text: "오류가 발생했습니다. 다시 시도해주세요.", sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, input, isLoading, handleInputChange, handleSubmit };
};