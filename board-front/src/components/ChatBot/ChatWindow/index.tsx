import React, { useRef, useEffect } from 'react';
import './style.css';
import SendButton from 'assets/image/expand-right-light.png';
import { useChat } from 'hooks/chatbot.hook';
import ReactMarkDown from 'react-markdown';

export default function ChatWindow() {
    // useChat Hook을 호출하여 채팅 관련 상태와 함수들을 가져옵니다.
    const { messages, input, isLoading, handleInputChange, handleSubmit } = useChat();
    
    // 스크롤을 항상 아래로 유지하기 위한 ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // messages 배열이 업데이트될 때마다 스크롤을 맨 아래로 이동

    return (
        <div className="chat-window-container">
            <div className="chat-window-messages">
                {/* messages 배열을 순회하며 각 메시지를 화면에 렌더링 */}
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                        {/* {msg.text} */}
                        <ReactMarkDown>{msg.text}</ReactMarkDown>
                    </div>
                ))}
                {/* 로딩 중일 때 '입력 중...' 메시지 표시 */}
                { !messages[1] &&
                    <div className='message-bubble sent'>AI가 제공한 위치 정보엔 오차가 있을 수 있습니다. 다시 한번 확인하세요.</div>
                }
                {isLoading && (
                    <div className="message-bubble received">
                        입력 중...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {/* form 태그로 감싸서 Enter 키로도 제출 가능하게 함 */}
            <form className="chat-window-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="메시지를 입력하세요."
                    className="chat-input"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading} // 로딩 중에는 입력 비활성화
                />
                <img
                    className='chat-send-button'
                    src={SendButton}
                    alt='Send'
                    onClick={handleSubmit} // 이미지 클릭으로도 제출
                />
            </form>
        </div>
    );
}