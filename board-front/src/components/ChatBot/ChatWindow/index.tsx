// import React, { useRef, useEffect } from 'react';
// import './style.css';
// import SendButton from 'assets/image/expand-right-light.png';
// import BackButton from 'assets/image/expand-left.png';
// import { PlaceInfo, useChat } from 'hooks/chatbot.hook';
// import ReactMarkDown from 'react-markdown';
// import PlaceInfoCard from '../ChatBotRecommend';
// import { useAiSearchStore } from 'hooks/Map/useKakaoSearch.hook';
// import { searchPlaceOnMapRequest } from 'apis';
// import { toast } from 'react-toastify';

// interface ChatWindowProps {
//     sessionId: string;
//     onBack: () => void;
// }

// export default function ChatWindow({ sessionId, onBack }: ChatWindowProps) {
//     // useChat Hook을 호출하여 채팅 관련 상태와 함수들을 가져옵니다.
//     const { messages, input, isLoading, handleInputChange, handleSubmit } = useChat(sessionId);
    
//     // 스크롤을 항상 아래로 유지하기 위한 ref
//     const messagesEndRef = useRef<HTMLDivElement>(null);

//     const { setAiSearchResults } = useAiSearchStore();

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]); // messages 배열이 업데이트될 때마다 스크롤을 맨 아래로 이동

//     const handleShowAllOnMap = async (places: PlaceInfo[]) => {
//         console.log("모든 장소를 지도에 표시합니다:", places);

//         // places 배열에 있는 각 장소의 주소로 API를 호출하는 '요청 목록'을 만듭니다.
//         const searchPromises = places.map(info => 
//             searchPlaceOnMapRequest(info.place_name));

//         try {
//             // Promise.all을 사용해 모든 API 요청을 동시에 보내고, 모든 응답이 올 때까지 기다립니다.
//             const results = await Promise.all(searchPromises);

//             // results는 [ [장소1], [장소2], ... ] 형태의 배열이므로, flatMap으로 하나의 배열로 합칩니다.
//             // 각 검색 결과에서 가장 정확도가 높은 첫 번째 장소만 선택합니다.
//             const allPlaces = results.flatMap(placeArray => placeArray.length > 0 ? placeArray[0] : []);
            
//             if (allPlaces.length > 0) {
//                 // 최종적으로 합쳐진 장소 목록으로 지도 상태를 업데이트합니다.
//                 setAiSearchResults(allPlaces);
//                 toast("지도에 모든 마커를 표시했습니다");
//             } else {
//                 alert("지도에 표시할 장소를 찾지 못했습니다.");
//             }
//         } catch (error) {
//             console.error("장소를 검색하는 중 오류가 발생했습니다.", error);
//             alert("장소를 검색하는 중 오류가 발생했습니다.");
//         }
//     };

//     return (
//         <div className="chat-window-container">
//             <button className='chat-window-back-button' onClick={onBack}>
//                 <img src={BackButton}></img>
//             </button>
//             <div className="chat-window-messages">
//                 {/* messages 배열을 순회하며 각 메시지를 화면에 렌더링 */}
//                 {messages.map((msg, index) => (
//                     <div key={index} className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}>
//                     {typeof msg.text === 'string' ? (
//                             <ReactMarkDown>{msg.text}</ReactMarkDown>
//                         ) : (
//                             <div className='place-info-cards-container'>
//                                 <div className='ai-comment'>{msg.text.comment}</div>
//                                 {msg.text.places.map((info, cardIndex) => (
//                                     <PlaceInfoCard key={cardIndex} info={info} />
//                                 ))}
//                                 <button 
//                                                                     //타입 명시 해줘야함(추후)  
//                                     onClick={() => handleShowAllOnMap((msg.text as any).places)}
//                                     className="route-pick-button"
//                                 >
//                                     Route Pick
//                                 </button>
//                             </div>
//                         )}
//                         </div>
//                     ))}
//                 {/* 로딩 중일 때 '입력 중...' 메시지 표시 */}
//                 { !messages[1] &&
//                     <div className='message-bubble sent'>AI가 제공한 위치 정보엔 오차가 있을 수 있습니다. 다시 한번 확인하세요.</div>
//                 }
//                 {isLoading && (
//                     <div className="message-bubble received">
//                         입력 중... 
//                     </div>
//                 )}
//                 <div ref={messagesEndRef} />
//             </div>
//             {/* form 태그로 감싸서 Enter 키로도 제출 가능하게 함 */}
//             <form className="chat-window-input-area" onSubmit={handleSubmit}>
//                 <input
//                     type="text"
//                     placeholder="메시지를 입력하세요."
//                     className="chat-input"
//                     value={input}
//                     onChange={handleInputChange}
//                     disabled={isLoading} // 로딩 중에는 입력 비활성화
//                 />
//                 <img
//                     className='chat-send-button'
//                     src={SendButton}
//                     alt='Send'
//                     onClick={handleSubmit} // 이미지 클릭으로도 제출
//                 />
//             </form>
//         </div>
//     );
// }

import React, { useRef, useEffect } from 'react';
import './style.css';
import SendButton from 'assets/image/expand-right-light.png';
import BackButton from 'assets/image/expand-left.png';
import { PlaceInfo, useChat } from 'hooks/chatbot.hook';
import ReactMarkDown from 'react-markdown';
import PlaceInfoCard from '../ChatBotRecommend';
import { useAiSearchStore } from 'hooks/Map/useKakaoSearch.hook';
import { searchPlaceOnMapRequest } from 'apis';

// ✅ 미니뷰어에서 어떤 장소를 띄울지 알려줄 전역 상태
import useRelativeStore from 'stores/relativeStore';
import { customErrToast } from '../../../hooks';

interface ChatWindowProps {
    sessionId: string;
    onBack: () => void;
}

export default function ChatWindow({ sessionId, onBack }: ChatWindowProps) {
    // useChat Hook을 호출하여 채팅 관련 상태와 함수들을 가져옵니다.
    const { messages, input, isLoading, handleInputChange, handleSubmit } = useChat(sessionId);
    
    // 스크롤을 항상 아래로 유지하기 위한 ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { setAiSearchResults } = useAiSearchStore();

    // ✅ 전역으로 "어떤 장소를 선택했는지" 저장하는 상태
    const { setSelectedPlaceName } = useRelativeStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // messages 배열이 업데이트될 때마다 스크롤을 맨 아래로 이동

    const handleShowAllOnMap = async (places: PlaceInfo[]) => {
        console.log("모든 장소를 지도에 표시합니다:", places);

        const searchPromises = places.map(info =>
            searchPlaceOnMapRequest(info.place_name)
        );

        try {
            const results = await Promise.all(searchPromises);

            const allPlacesRaw = results.flatMap(placeArray =>
                placeArray.length > 0 ? placeArray[0] : []
            );

            if (allPlacesRaw.length > 0) {

                // 🔥 Kakao 검색 결과에 place_url / id 등이 있을 수 있으므로
                //    여기서 미리 placeUrl을 만들어서 붙여준다.
                const allPlaces = allPlacesRaw.map((p: any) => {
                    const base = p || {};

                    const rawUrl =
                        base.place_url ||
                        base.placeUrl ||
                        base.kakaoUrl ||
                        base.kakao_url ||
                        base.url ||
                        (base.id ? `https://place.map.kakao.com/${base.id}` : '');

                    const placeUrl =
                        typeof rawUrl === 'string' && rawUrl.trim().length > 0
                            ? rawUrl.replace(/^http:\/\//, 'https://')
                            : undefined;

                    return placeUrl
                        ? { ...base, placeUrl } // 🔥 명시적으로 placeUrl 필드를 달아준다
                        : base;
                });

                // ✅ 1) 지도에 모든 마커를 표시 (placeUrl까지 포함된 상태)
                setAiSearchResults(allPlaces);

                // ✅ 2) 미니뷰어가 어떤 장소를 우선 띄울지 알려주기
                const first = allPlaces[0] as any;

                const nameForMiniViewer =
                    first.place_name ||
                    first.name ||
                    '';

                if (nameForMiniViewer) {
                    setSelectedPlaceName(nameForMiniViewer);
                }

                customErrToast("지도에 모든 마커를 표시했습니다");
            } else {
                alert("지도에 표시할 장소를 찾지 못했습니다.");
            }
        } catch (error) {
            console.error("장소를 검색하는 중 오류가 발생했습니다.", error);
            alert("장소를 검색하는 중 오류가 발생했습니다.");
        }
    };


    return (
        <div className="chat-window-container">
            <button className='chat-window-back-button' onClick={onBack}>
                <img src={BackButton}></img>
            </button>
            <div className="chat-window-messages">
                {/* messages 배열을 순회하며 각 메시지를 화면에 렌더링 */}
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}
                    >
                        {typeof msg.text === 'string' ? (
                            <ReactMarkDown>{msg.text}</ReactMarkDown>
                        ) : (
                            <div className='place-info-cards-container'>
                                <div className='ai-comment'>{msg.text.comment}</div>
                                {msg.text.places.map((info, cardIndex) => (
                                    <PlaceInfoCard key={cardIndex} info={info} />
                                ))}
                                <button
                                    // TODO: 타입 명시 (추후)
                                    onClick={() => handleShowAllOnMap((msg.text as any).places)}
                                    className="route-pick-button"
                                >
                                    Route Pick
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {/* 로딩 중일 때 '입력 중...' 메시지 표시 */}
                { !messages[1] &&
                    <div className='message-bubble sent'>
                        AI가 제공한 위치 정보엔 오차가 있을 수 있습니다. 다시 한번 확인하세요.
                    </div>
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
