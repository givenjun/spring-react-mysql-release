// components/ChatBot/ChatList.tsx

import { useEffect, useState } from "react";

interface ChatListProps {
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
}

export default function ChatList({ onSelectSession, onNewChat }: ChatListProps) {
    const [sessions, setSessions] = useState<any>({});

    useEffect(() => {
        // localStorage에서 세션 목록 불러오기
        const allSessions = JSON.parse(window.localStorage.getItem('chat_sessions') || '{}');
        setSessions(allSessions);
    }, []);

    return (
        <div>
            {/* 상단 헤더나 제목 */}
            <div>대화 목록</div>
            <button onClick={onNewChat}>새 문의하기</button>
            
            {/* 세션 목록 렌더링 */}
            <ul>
                {Object.keys(sessions).map(sessionId => (
                    <li key={sessionId} onClick={() => onSelectSession(sessionId)}>
                        {sessions[sessionId].title || "제목 없음"}
                    </li>
                ))}
            </ul>
        </div>
    );
}