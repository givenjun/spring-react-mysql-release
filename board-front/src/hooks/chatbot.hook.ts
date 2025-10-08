import { askGeminiRequest } from 'apis';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';

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

const CHAT_SESSION_KEY = 'chat_session';

export const useChat = (sessionId: string | null): UseChatReturn => {
    // 채팅 메시지 목록 상태
    const [messages, setMessages] = useState<Message[]>(() => {
        if (!sessionId) {
            return [{ text: "안녕하세요! 무엇을 도와드릴까요?", sender: 'ai' }];
        }
        try {
            const allSessions = JSON.parse(window.localStorage.getItem('chat_sessions') || '{}');
            return allSessions[sessionId]?.messages || [{ text: "안녕하세요! 무엇을 도와드릴까요?", sender: 'ai'}];
        } catch (error) {
            console.error("Failed to parse messages from local storage", error);
        }
        return [{ text: "안녕하세요! 무엇을 도와드릴까요?", sender: 'ai' }];
    });
    // 사용자 입력 값 상태
    const [input, setInput] = useState<string>('');
    // API 요청 로딩 상태
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (sessionId && messages.length > 1) {
            try {
                const allSessions = JSON.parse(window.localStorage.getItem('chat_sessions') || '{}');
                const currentSession = allSessions[sessionId] || {};
                
                const updatedSession = {
                    ...currentSession,
                    title: currentSession.title || messages[1]?.text.substring(0, 20) || "새로운 대화", // 첫 사용자 메시지로 제목 생성
                    messages: messages,
                    lastUpdated: new Date().toISOString()
                };

                const newSessions = { ...allSessions, [sessionId]: updatedSession };
                window.localStorage.setItem('chat_sessions', JSON.stringify(newSessions));
            } catch (error) {
            console.error("Failed to save messages to local storage", error);
            }
        }
    }, [messages, sessionId]);
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
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        setInput('');
        setIsLoading(true);

        try {
            const recentMessages = updatedMessages.slice(1).slice(-10);
            const conversationHistory = recentMessages
                .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
                .join('\n');
            // 2. API 호출
            const aiResponseText = await askGeminiRequest({ prompt: conversationHistory });

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