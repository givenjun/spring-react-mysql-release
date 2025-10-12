import './style.css';
import SendIcon from 'assets/image/send-icon.png';
import MoreIcon from 'assets/image/more.png'
import { useEffect, useRef, useState } from "react";

const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
}

interface ChatListProps {
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
}

export default function ChatList({ onSelectSession, onNewChat }: ChatListProps) {
    const [sessions, setSessions] = useState<any>({});

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // localStorage에서 세션 목록 불러오기
        const allSessions = JSON.parse(window.localStorage.getItem('chat_sessions') || '{}');
        setSessions(allSessions);
    }, []);

    // useEffect(() => {
    //     function handleClickOutside(event: MouseEvent) {
    //         if (!activeMenu) return;
    //         const target = event.target as Node;
    //         const container = document.querySelector(`[data-menu-session="${activeMenu}"]`);
    //         // 열린 메뉴 컨테이너가 있고 클릭 대상이 그 내부면 무시
    //         if (container && container.contains(target)) return;
    //         // 아니면 메뉴 닫기
    //         setActiveMenu(null);
    //     }
    //     document.addEventListener("mousedown", handleClickOutside);
    //     return () => {
    //         document.removeEventListener("mousedown", handleClickOutside);
    //     };
    // }, [activeMenu]);

    useEffect(() => {
        if (renamingSessionId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [renamingSessionId]);

    const handleDeleteSession = (sessionIdToDelete: string) => {
        if (window.confirm("이 대화를 정말 삭제하시겠습니까?")) {
            const allSessions = { ...sessions };
            delete allSessions[sessionIdToDelete];
            window.localStorage.setItem('chat_sessions', JSON.stringify(allSessions));
            setSessions(allSessions);
            setActiveMenu(null);
        }
    };

    const toggleMenu = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === sessionId ? null : sessionId);
    };

    // 이름 변경을 시작하는 함수
    const handleStartRename = (sessionId: string) => {
        setRenamingSessionId(sessionId);
        setNewTitle(sessions[sessionId].title || "제목 없음");
        setActiveMenu(null); // 메뉴 닫기
    };

    // 이름 변경을 저장하는 함수
    const handleSaveRename = (sessionId: string) => {
        if (!newTitle.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        const updatedSessions = {
            ...sessions,
            [sessionId]: {
                ...sessions[sessionId],
                title: newTitle,
            }
        };
        window.localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
        setRenamingSessionId(null); // 이름 변경 모드 종료
    };

    return (
        <div className='chat-list-container'>
            <div className='chat-session-container'>
                {Object.keys(sessions).map(sessionId => {
                    const session = sessions[sessionId];
                    const lastMessage = session.messages[session.messages.length - 1];
                    const formattedDate = formatDateTime(session.lastUpdated);

                    return (
                    <div 
                        className='chat-session-items' 
                        key={sessionId} onClick={() => onSelectSession(sessionId)}
                    >
                        <div className='chat-session-header'>
                            {renamingSessionId === sessionId ? (
                                // --- 이름 변경 시 보여줄 입력 필드 ---
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newTitle}
                                    className='chat-session-rename-input'
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    onBlur={() => handleSaveRename(sessionId)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(sessionId)}
                                    onClick={(e) => e.stopPropagation()} // 부모 onClick 이벤트 방지
                                />
                            ) : (
                                // --- 평상시 보여줄 세션 제목 ---
                                <div className='chat-session-title'>
                                    {session.title || "제목 없음"}
                                </div>
                            )}
                            <div className='chat-session-date'>{formattedDate}</div>
                            
                            <div className='chat-session-more-container' ref={menuRef}>
                                <button
                                    className='chat-session-more-button'
                                    onClick={(e) => toggleMenu(e, sessionId)}
                                >
                                    <img src={MoreIcon} style={{width:'100%'}}></img>
                                </button>
                                {activeMenu === sessionId && (
                                    <div className="more-menu">
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartRename(sessionId)
                                        }}>이름 바꾸기</button>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSession(sessionId)
                                        }}>삭제</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='chat-session-contents'>
                            {(() => {
                                const lastMessageContent = lastMessage?.text;
                                let previewText = '';

                                if (typeof lastMessageContent === 'string') {
                                    previewText = lastMessageContent;
                                } else if (Array.isArray(lastMessageContent) && lastMessageContent.length > 0) {
                                    const firstPlace = lastMessageContent[0]
                                    if (lastMessageContent.length > 1) {
                                        previewText = `[맛집 추천] ${firstPlace.place_name} 외 ${lastMessageContent.length - 1}곳`;
                                    } else {
                                        previewText = `[맛집 추천] ${firstPlace.place_name}\n${firstPlace.reason}`;
                                    }
                                }

                                return previewText.length < 50 ? 
                                    previewText : 
                                    (previewText.substring(0, 50) + '...');
                            })()}
                        </div>
                    </div>
                );
                })}
            </div>
            <button className='chat-new-session-button' onClick={onNewChat}>
                새 문의하기
                <img src={SendIcon} style={{width:'15%', margin:'2px 0 0 0'}}></img>
            </button>
        </div>
    );
}