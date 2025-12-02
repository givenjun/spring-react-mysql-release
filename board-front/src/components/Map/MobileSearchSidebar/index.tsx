import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_PATH, BOARD_PATH } from 'constant';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hook';
import LogoIcon from 'assets/image/routepick-logo-icon.png';

import { v4 as uuidv4 } from 'uuid';

import ChatList from 'components/ChatBot/ChatList/index'; 
import ChatWindow from 'components/ChatBot/ChatWindow/index';
import { useAiSearchStore } from 'hooks/Map/useKakaoSearch.hook';

interface Place {
  id: string; place_name: string; x: string; y: string;
  address_name?: string; road_address_name?: string; phone?: string;
}
export interface CoordsPick { lat: number; lng: number; name: string; }
interface RouteOptionItem {
  id: string; name: '빠른길' | '권장길' | '쉬운길';
  path: { lat: number; lng: number }[];
  timeSec: number; distanceM: number; complexity: number;
}

interface MobileSearchSidebarProps {
  searchResults: Place[];
  onClickItem: (place: Place) => void;
  onSearch: (keyword: string) => void;
  onRouteByCoords?: (start: CoordsPick, end: CoordsPick) => void;
  routeOptions?: RouteOptionItem[];
  onSelectRoute?: (index: number) => void;
  onChangeMapMode?: (mode: 'explore' | 'route' | 'chat') => void;
  
  detailContent?: React.ReactNode | null;
  onCloseDetail?: () => void;
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const SwapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
);

export default function MobileSearchSidebar({
  searchResults, onClickItem, onSearch, onRouteByCoords,
  routeOptions = [], onSelectRoute, onChangeMapMode,
  detailContent, onCloseDetail
}: MobileSearchSidebarProps) {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'search' | 'route' | 'chat'>('search');
  // ✨ [추가] 선택된 채팅 세션 ID를 저장하는 상태
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [sheetMode, setSheetMode] = useState<'hidden' | 'min' | 'mid' | 'max'>('min');

  const HIDDEN_HEIGHT = 40;  
  const MIN_HEIGHT = 160;    
  const MID_HEIGHT = window.innerHeight * 0.5; 
  const MAX_HEIGHT = window.innerHeight * 0.88;

  const sheetRef = useRef<HTMLDivElement>(null);
  const metrics = useRef({ startY: 0, startHeight: 0, isDragging: false });

  const [routeQuery, setRouteQuery] = useState({ start: '', end: '' });
  const [picked, setPicked] = useState<{ start: CoordsPick | null; end: CoordsPick | null }>({ start: null, end: null });
  const [suggestions, setSuggestions] = useState<{ start: Place[]; end: Place[] }>({ start: [], end: [] });
  const [focusedField, setFocusedField] = useState<'start' | 'end' | null>(null);

  const { searchManyOnce } = useKakaoSearch();
  const routeQueryRef = useRef(routeQuery);
  useEffect(() => { routeQueryRef.current = routeQuery; }, [routeQuery]);

  const prevDetailContentRef = useRef<boolean>(!!detailContent);
  
  useEffect(() => {
    const hasContent = !!detailContent;
    if (!prevDetailContentRef.current && hasContent) {
      setSheetMode('mid');
    }
    prevDetailContentRef.current = hasContent;
  }, [detailContent]);

  useEffect(() => {
    if (!sheetRef.current) return;
    
    let targetHeight = MIN_HEIGHT;
    if (sheetMode === 'hidden') targetHeight = HIDDEN_HEIGHT;
    if (sheetMode === 'mid') targetHeight = MID_HEIGHT;
    if (sheetMode === 'max') targetHeight = MAX_HEIGHT;

    sheetRef.current.style.transition = 'height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    sheetRef.current.style.height = `${targetHeight}px`;
  }, [sheetMode]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sheetRef.current) return;
    metrics.current.isDragging = true;
    metrics.current.startY = e.touches[0].clientY;
    metrics.current.startHeight = sheetRef.current.getBoundingClientRect().height;
    sheetRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!metrics.current.isDragging || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - metrics.current.startY;
    const newHeight = metrics.current.startHeight - deltaY;
    if (newHeight >= HIDDEN_HEIGHT && newHeight <= MAX_HEIGHT) {
      sheetRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleTouchEnd = () => {
    if (!metrics.current.isDragging || !sheetRef.current) return;
    metrics.current.isDragging = false;
    const currentHeight = sheetRef.current.getBoundingClientRect().height;
    const distHidden = Math.abs(currentHeight - HIDDEN_HEIGHT);
    const distMin = Math.abs(currentHeight - MIN_HEIGHT);
    const distMid = Math.abs(currentHeight - MID_HEIGHT);
    const distMax = Math.abs(currentHeight - MAX_HEIGHT);
    const closest = Math.min(distHidden, distMin, distMid, distMax);

    if (closest === distHidden) setSheetMode('hidden');
    else if (closest === distMin) setSheetMode('min');
    else if (closest === distMid) setSheetMode('mid');
    else setSheetMode('max');
  };

  const handleTabChange = (tab: 'search' | 'route' | 'chat') => {
    setActiveTab(tab);
    
    if (tab === 'chat') {
        setSheetMode('max');
        onChangeMapMode?.('chat'); 
        setSelectedSessionId(null); 
    } else {
        onChangeMapMode?.(tab === 'search' ? 'explore' : 'route');
        setSheetMode('mid');
    }
    
    if (detailContent && onCloseDetail) onCloseDetail(); 
  };

  const onInputFocus = () => {};

  const toggleSheet = () => {
    if (sheetMode === 'hidden') setSheetMode('min');
    else if (sheetMode === 'min') setSheetMode('mid');
    else setSheetMode('min');
  };

  const BackArrowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  const handleSearch = () => {
    onSearch(keyword.trim());
    setSheetMode('mid'); 
  };

  const handleRouteInput = (field: 'start' | 'end', val: string) => {
    setRouteQuery(prev => ({ ...prev, [field]: val }));
    setPicked(prev => ({ ...prev, [field]: null }));
  };
  const handleRouteKeyDown = async (e: React.KeyboardEvent, field: 'start' | 'end') => {
 
    if (e.key === 'Enter') {
      e.preventDefault();
  
      const q = routeQueryRef.current[field].trim();
      if (q.length < 2) return;
      const list = await searchManyOnce(q, 10);
      setSuggestions(prev => ({ ...prev, [field]: list }));
      setFocusedField(field);
      setSheetMode('mid'); 
    }
  };
  
  const selectSuggestion = (field: 'start' | 'end', place: Place) => {
    const pick: CoordsPick = { name: place.place_name, lat: parseFloat(place.y), lng: parseFloat(place.x) };
    setPicked(prev => ({ ...prev, [field]: pick }));
    setRouteQuery(prev => ({ ...prev, [field]: place.place_name }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    setFocusedField(null);
  };
  const handleRouteSubmit = () => {
    if (picked.start && picked.end && onRouteByCoords) {
      onRouteByCoords(picked.start, picked.end);
      setFocusedField(null);
      setSheetMode('min');
    }
  };
  const handleSwap = () => {
    setRouteQuery(prev => ({ start: prev.end, end: prev.start }));
    setPicked(prev => ({ start: picked.end, end: picked.start }));
  };

  const fmtTime = (sec: number) => Math.round(sec / 60) + '분';
  const fmtDist = (m: number) => m < 1000 ? `${m}m` : `${(m/1000).toFixed(1)}km`;
  const { aiSearchResults } = useAiSearchStore();
  // ✨ [수정] 세션 선택 핸들러 구현
  const handleSelectSession = (sessionId: string) => {
    console.log("세션 선택됨:", sessionId);
    setSelectedSessionId(sessionId); // 상태 업데이트 -> 리렌더링 발생 -> ChatWindow 표시됨
  };

  // ✨ [추가] 채팅방에서 뒤로가기 핸들러
  const handleBackToChatList = () => {
    setSelectedSessionId(null);
  };
  useEffect(() => {
      if (activeTab === 'chat' && aiSearchResults.length > 0) {
          
          setActiveTab('search'); 
          
          onChangeMapMode?.('explore');
          
          setSheetMode('mid'); 
      }
    }, [aiSearchResults]);
    
  const handleNewChat = () => {
    const newSessionId = uuidv4(); // 1. 고유 ID 생성
    setSelectedSessionId(newSessionId); // 2. 상태 업데이트 -> ChatWindow로 화면 전환됨
  };

  return (
    <>
      <div className="mobile-top-header" style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, padding: 20 }}>
        <img src={LogoIcon} alt="RoutePick" className="mobile-logo-img" onClick={() => window.location.reload()} style={{ height: 30 }} />
      </div>

      <div className="mobile-ui-container">
        
        <div 
          ref={sheetRef}
          className={`mobile-bottom-sheet`}
          style={{ 
            height: `${MIN_HEIGHT}px`, 
            touchAction: 'none',
            zIndex: 100, 
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: 0, width: '100%',
            background: 'white',
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden', 
            display: 'flex', flexDirection: 'column'
          }} 
        >
          {/* 핸들 */}
          <div 
            className="sheet-handle-area" 
            onClick={toggleSheet}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', background: 'white', flexShrink: 0 }}
          >
            <div className="sheet-handle-bar" style={{ width: 40, height: 5, background: '#ddd', borderRadius: 5 }} />
          </div>

          {/* 검색창 영역 (채팅 탭이 아닐 때, 상세 내용이 없을 때만 표시) */}
          {!detailContent && activeTab !== 'chat' && (
            <div className="sheet-search-box" style={{ padding: '0 20px 20px', flexShrink: 0 }}>
              {activeTab === 'search' ? (
                <div className="input-icon-wrap">
                  <span className="input-icon"><SearchIcon /></span>
                  <input 
                    type="text" className="mobile-input-style" placeholder="장소, 주소 검색"
                    value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onFocus={onInputFocus} 
                  />
                </div>
              ) : (
                <div className="mobile-route-inputs">
                  <div className="route-row">
                    <input placeholder="출발지" value={routeQuery.start} onChange={(e)=>handleRouteInput('start',e.target.value)} onKeyDown={(e)=>handleRouteKeyDown(e,'start')} onFocus={onInputFocus}/>
                    <div onClick={handleSwap} style={{padding:4}}><SwapIcon/></div>
                  </div>
                  <div className="route-row">
                    <input placeholder="도착지" value={routeQuery.end} onChange={(e)=>handleRouteInput('end',e.target.value)} onKeyDown={(e)=>handleRouteKeyDown(e,'end')} onFocus={onInputFocus}/>
                    <button onClick={handleRouteSubmit} disabled={!picked.start||!picked.end} style={{border:'none',background:'transparent',color:(picked.start&&picked.end)?'#4f46e5':'#ccc',fontWeight:'bold',fontSize:13,whiteSpace:'nowrap'}}>길찾기</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 컨텐츠 리스트 (스크롤) */}
          <div 
            className="sheet-content-scroll" 
            style={{ 
                flex: 1, 
                overflowY: activeTab === 'chat' ? 'hidden' : 'auto', 
                padding: activeTab === 'chat' ? 0 : '0 20px' 
            }}
          >
            
            {/* ✨ [수정] 채팅 탭 렌더링 로직 강화 */}
            {activeTab === 'chat' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {selectedSessionId ? (
                      <>
                            {/* 1. 모바일 전용 채팅 헤더 (뒤로가기 버튼) */}
                            <div style={{
                                height: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 15px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: '#fff',
                                flexShrink: 0 // 높이 줄어듦 방지
                            }}>
                                <button 
                                    onClick={handleBackToChatList}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', marginRight: '10px' }}
                                >
                                    <BackArrowIcon />
                                </button>
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>채팅</span>
                            </div>

                            {/* 2. 채팅창 컨테이너 */}
                            <div style={{ 
                                flex: 1, 
                                position: 'relative', 
                                overflow: 'hidden',
                                // 중요: 하단 네비게이션 바 높이만큼(약 60px) 패딩을 줘서 입력창이 가려지지 않게 함
                                paddingBottom: '60px' 
                            }}>
                                {/* ChatWindow 내부의 스타일(height: 80% 등)을 무시하고 
                                   꽉 채우기 위해 CSS Override용 style 추가 
                                */}
                                <div style={{ height: '100%', width: '100%' }} className="mobile-chat-override">
                                    <ChatWindow 
                                        key={selectedSessionId}
                                        sessionId={selectedSessionId} 
                                        onBack={handleBackToChatList}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', paddingBottom: '60px', overflowY: 'auto' }}>
                            <ChatList 
                                onSelectSession={handleSelectSession} 
                                onNewChat={handleNewChat} 
                            />
                        </div>
                    )}
                </div>
            ) : detailContent ? (
               <div className="mobile-detail-wrapper" style={{ paddingBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                     <span style={{ fontSize: 16, fontWeight: 'bold' }}>경로 내 음식점 리스트</span>
                     <button 
                        onClick={onCloseDetail} 
                        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 5 }}
                     >✕</button>
                  </div>
                  {detailContent}
               </div>
            ) : (
               <>
                {/* ... (기존 탐색/길찾기 결과 렌더링 코드 유지) ... */}
                {activeTab === 'search' && searchResults.map((place, i) => (
                  <div key={i} className="search-result-item" onClick={() => { onClickItem(place); setSheetMode('min'); }}>
                    <div className="place-name" style={{fontSize:16, fontWeight:600, marginBottom:4}}>{place.place_name}</div>
                    <div className="place-address" style={{fontSize:13, color:'#888'}}>{place.road_address_name || place.address_name}</div>
                  </div>
                ))}
                
                {/* ... (생략된 부분들 유지) ... */}

                {activeTab === 'route' && focusedField && suggestions[focusedField].map((place, i) => (
                    <div key={i} className="search-result-item" onClick={() => selectSuggestion(focusedField, place)}>
                        <div className="place-name">{place.place_name}</div>
                        <div className="place-address" style={{fontSize:12}}>{place.road_address_name || place.address_name}</div>
                    </div>
                ))}

                {activeTab === 'route' && !focusedField && routeOptions.map((r, i) => (
                    <div key={r.id} className="search-result-item" onClick={() => { onSelectRoute?.(i); setSheetMode('min'); }} style={{display:'flex',justifyContent:'space-between'}}>
                        <div>
                        <span style={{fontWeight:800, marginRight:8, color: i===0?'#ffaf00':'#8a2ea1'}}>{r.name}</span>
                        <b>{fmtTime(r.timeSec)}</b>
                        </div>
                        <div style={{color:'#666'}}>{fmtDist(r.distanceM)}</div>
                    </div>
                ))}

                {activeTab === 'search' && keyword && searchResults.length === 0 && (
                  <div style={{padding:20, textAlign:'center', color:'#999'}}>검색 결과가 없습니다.</div>
                )}
               </>
            )}

          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="mobile-bottom-nav" style={{ zIndex: 101 }}> 
          <button className={`nav-btn ${activeTab === 'search' ? 'active-filled' : ''}`} onClick={() => handleTabChange('search')}>탐색</button>
          <button className={`nav-btn ${activeTab === 'route' ? 'active-filled' : ''}`} onClick={() => handleTabChange('route')}>길찾기</button>
          <button className="nav-btn" onClick={() => navigate(BOARD_PATH())}>커뮤니티</button>
          
          <button 
            className={`nav-btn ${activeTab === 'chat' ? 'active-filled' : ''}`} 
            onClick={() => handleTabChange('chat')}
          >
            채팅
          </button>
        </div>

      </div>
    </>
  );
}