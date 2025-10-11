import { askGeminiRequest } from 'apis';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Place, useAiSearchStore } from './Map/useKakaoSearch.hook';

export interface PlaceInfo {
    place_name: string;
    address: string;
    menu: string;
    reason: string;
    review_summary: string;
}

// 메시지 객체의 타입을 정의합니다.
interface Message {
    text: string | PlaceInfo[];
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

export const useChat = (sessionId: string | null): UseChatReturn => {
    const { setAiSearchResults } = useAiSearchStore();
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
                
                let title = currentSession.title;

                if (!title) {
                    const firstUserMessage = messages[1];
                    if (firstUserMessage) {
                        const firstMessageContent = firstUserMessage.text;
                        if (typeof firstMessageContent === 'string') {
                            title = firstMessageContent.substring(0, 30); 
                        } else if (firstMessageContent && 'place_name' in firstMessageContent) {
                            title = firstMessageContent.place_name;
                        }
                    }
                }
                const updatedSession = {
                    ...currentSession,
                    title: title || "새로운 대화", // 첫 사용자 메시지로 제목 생성
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

        const userMessage: Message = { text: input, sender: 'user' };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        setInput('');
        setIsLoading(true);

        try {
            const recentMessages = updatedMessages.slice(1).slice(-10);
            const conversationHistory = recentMessages
                .map(msg => {
                    const textContent = typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);
                    return `${msg.sender === 'user' ? 'User' : 'AI'}: ${textContent}`;
                })
                .join('\n');
            
            const responseFromServer = await askGeminiRequest({ prompt: conversationHistory });
            
            let responseData;

            if (typeof responseFromServer === 'string') {
                try {
                    let jsonStringToParse = responseFromServer.trim();

                    // ✅❗ AI가 보낸 텍스트가 대괄호 없이 '{'로 시작하고 '}'로 끝나면,
                    //      유효한 JSON 배열이 되도록 강제로 대괄호를 씌워줍니다.
                    if (jsonStringToParse.startsWith("{") && jsonStringToParse.endsWith("}")) {
                        jsonStringToParse = `[${jsonStringToParse}]`;
                    }
                    
                    responseData = JSON.parse(jsonStringToParse);

                } catch (error) {
                    responseData = { type: 'text', content: responseFromServer};
                } 
            } else {
                responseData = responseFromServer;
            }

        if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.place_name) {
            const aiMessage: Message = { text: responseData as PlaceInfo[], sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }
        else if (responseData?.place_name && responseData?.address) {
            const aiMessage: Message = { text: [responseData as PlaceInfo], sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }
        else if (Array.isArray(responseData)) {
            setAiSearchResults(responseData);
            const aiMessage: Message = { text: "요청하신 장소를 지도에 표시했어요! 🗺️", sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }
        else if (responseData?.type === 'text' && typeof responseData.content === 'string') {
            const aiMessage: Message = { text: responseData.content, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }
        else {
            console.error("Unexpected response data format:", responseData);
            const aiMessage: Message = { text: "응답을 처리하는 중 문제가 발생했습니다.", sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }

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