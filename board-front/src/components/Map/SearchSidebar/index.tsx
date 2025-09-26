// import React, { useState } from 'react';
// import './style.css';
// import { useNavigate } from 'react-router-dom';
// import { BOARD_PATH, USER_PATH } from 'constant';

// interface Place {
//   id: string;
//   place_name: string;
//   x: string;
//   y: string;
//   address_name?: string;
//   road_address_name?: string;
//   category_name?: string;
//   phone?: string;
// }

// interface SearchSidebarProps {
//   searchResults: Place[];
//   onClickItem: (index: number) => void;
//   selectedIndex: number | null;
//   isOpen: boolean;
//   toggleOpen: () => void;
//   onSearch: (start: string, goal: string) => void;
// }

// export default function SearchSidebar({
//   isOpen,
//   toggleOpen,
//   searchResults,
//   onClickItem,
//   selectedIndex,
//   onSearch,
// }: SearchSidebarProps) {
//   const navigate = useNavigate();
//   const [keyword, setKeyword] = useState('');

//   const onBoardClickHandler = () => navigate(BOARD_PATH());
//   const onUserClickHandler = () => navigate(USER_PATH(''));

//   const onKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setKeyword(e.target.value);
//   };

//   const onKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === 'Enter') onSearchClick();
//   };

//   const onSearchClick = () => {
//     if (!keyword.trim()) return;
//     onSearch(keyword.trim(), ''); // 두 번째 인자는 도착지 등 확장 대비
//   };

//   return (
//     <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
//       {/* 열기/닫기 버튼 */}
//       <div className="slideBtnContainer">
//         <div className={`slideBtn ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
//           <div className="icon-box">
//             <div className={`icon ${isOpen ? 'expand-left-icon' : 'expand-right-icon'}`} />
//           </div>
//         </div>
//       </div>

//       {/* 사이드바 내용 */}
//       <div className="sidebar-content" >
//         <div className="sidebar-title"></div>

//         {/* 검색창 */}
//         <div className="sidebar-search-input-box">
//           <div className="search-input-wrapper">
//             <input
//               type="text"
//               placeholder="장소, 주소 검색"
//               value={keyword}
//               onChange={onKeywordChange}
//               onKeyDown={onKeywordKeyDown}
//             />
//             <div className="search-icon" onClick={onSearchClick}>
//               <div className="icon search-light-icon" />
//             </div>
//           </div>
//         </div>

//         {/* 버튼 그룹 */}
//         <div className="button-group">
//           <button className="button" onClick={onSearchClick}>탐색</button>
//           <button className="button">{`길찾기`}</button>
//           <button className="button" onClick={onBoardClickHandler}>커뮤니티</button>
//           <button className="button" onClick={onUserClickHandler}>MY</button>
//         </div>
// </div>
//         {/* 검색 결과 리스트 */}
//         {searchResults.length > 0 && (
//           <div className="search-result-list">
//             {searchResults.map((place, index) => (
//               <div
//                 key={place.id || index}
//                 className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
//                 onClick={() => onClickItem(index)}
//                 onMouseEnter={() => onClickItem(index)}
//               >
//                 <div className="place-name">{place.place_name}</div>
//                 <div className="place-address">{place.road_address_name || place.address_name}</div>
//                 {place.phone && <div className="place-phone">{place.phone}</div>}
//               </div>
//             ))}
//           </div>
//         )}
      
//     </div>
//   );
// }

// components/Map/SearchSidebar/index.tsx
// src/components/Map/SearchSidebar/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { BOARD_PATH, USER_PATH } from 'constant';

declare global {
  interface Window { kakao: any; }
}
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

interface Place {
  id: string;
  place_name: string;
  x: string; // lng
  y: string; // lat
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;
}

export interface CoordsPick {
  lat: number;
  lng: number;
  name: string;
}

interface SearchSidebarProps {
  searchResults: Place[];
  onClickItem: (place: Place) => void;
  selectedIndex: number | null;
  isOpen: boolean;
  toggleOpen: () => void;

  // 일반 검색
  onSearch: (start: string, goal: string) => void;

  // 길찾기(권장): 선택된 좌표로 바로 요청
  onRouteByCoords?: (start: CoordsPick, end: CoordsPick) => void;

  // (선택) 키워드만 넘기고 부모에서 좌표 변환할 때 사용
  onRouteSearch?: (startKeyword: string, endKeyword: string) => void;
}

export default function SearchSidebar({
  isOpen,
  toggleOpen,
  searchResults,
  onClickItem,
  selectedIndex,
  onSearch,
  onRouteByCoords,
  onRouteSearch,
}: SearchSidebarProps) {
  const navigate = useNavigate();

  // ===== 모드 전환: 탭은 항상 보이고, 아래 영역만 교체 =====
  const [mode, setMode] = useState<'search' | 'route'>('search');
  const enterRouteMode = () => setMode('route');
  const exitRouteMode = () => setMode('search');

  // ===== 검색 모드 =====
  const [keyword, setKeyword] = useState('');
  const onSearchClick = () => {
    const q = keyword.trim();
    if (!q) return;
    onSearch(q, '');
  };

  // ===== 길찾기 모드 (카카오 자동완성 + 검증) =====
  type Field = 'start' | 'end';

  const [routeQuery, setRouteQuery] = useState({ start: '', end: '' });
  const [picked, setPicked] = useState<{ start: CoordsPick | null; end: CoordsPick | null }>({
    start: null,
    end: null,
  });

  const [suggestions, setSuggestions] = useState<{ start: Place[]; end: Place[] }>({
    start: [],
    end: [],
  });
  const [openDrop, setOpenDrop] = useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

  // kakao Places 인스턴스
  const places = useMemo(() => {
    return kakao?.maps?.services ? new kakao.maps.services.Places() : null;
  }, []);

  // 디바운스
  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => clearTimer, []); // 언마운트 시 타이머 클리어

  const debouncedSearch = (field: Field, q: string) => {
    if (!places) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (!q.trim()) {
        setSuggestions((s) => ({ ...s, [field]: [] }));
        return;
      }
      places.keywordSearch(q, (data: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK) {
          const list: Place[] = data.map((d: any) => ({
            id: d.id,
            place_name: d.place_name,
            x: d.x,
            y: d.y,
            address_name: d.address_name,
            road_address_name: d.road_address_name,
            phone: d.phone,
            category_name: d.category_name,
          }));
          setSuggestions((s) => ({ ...s, [field]: list }));
          setOpenDrop((o) => ({ ...o, [field]: true }));
        } else {
          setSuggestions((s) => ({ ...s, [field]: [] }));
        }
      });
    }, 250);
  };

  // 입력 변경
  const onRouteChange = (field: Field, v: string) => {
    setRouteQuery((q) => ({ ...q, [field]: v }));
    setPicked((p) => ({ ...p, [field]: null }));
    if (v.trim()) debouncedSearch(field, v);
    else {
      setSuggestions((s) => ({ ...s, [field]: [] }));
      setOpenDrop((o) => ({ ...o, [field]: false }));
    }
  };

  // 제안 선택
  const pickSuggestion = (field: Field, p: Place) => {
    const item: CoordsPick = {
      name: p.place_name,
      lat: parseFloat(p.y),
      lng: parseFloat(p.x),
    };
    setPicked((prev) => ({ ...prev, [field]: item }));
    setRouteQuery((q) => ({
      ...q,
      [field]: `${p.place_name} (${p.road_address_name || p.address_name || ''})`,
    }));
    setSuggestions((s) => ({ ...s, [field]: [] }));
    setOpenDrop((o) => ({ ...o, [field]: false }));
  };

  // 제출
  const canSubmit = !!picked.start && !!picked.end;
  const submitRoute = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    if (onRouteByCoords) {
      onRouteByCoords(picked.start!, picked.end!);
    } else if (onRouteSearch) {
      onRouteSearch(picked.start!.name, picked.end!.name);
    }
  };

  // 외부 클릭/ESC 시 드롭다운 닫기
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenDrop({ start: false, end: false });
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDrop({ start: false, end: false });
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // 네비 버튼
  const onBoardClickHandler = () => navigate(BOARD_PATH());
  const onUserClickHandler = () => navigate(USER_PATH(''));

  return (
    <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
      {/* 열기/닫기 */}
      <div className="slideBtnContainer">
        <div className={`slideBtn ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
          <div className="icon-box">
            <div className={`icon ${isOpen ? 'expand-left-icon' : 'expand-right-icon'}`} />
          </div>
        </div>
      </div>

      <div className="sidebar-content" ref={containerRef}>
        <div className="sidebar-title" />

        {/* 탭(항상 보임) */}
        <div className="button-group">
          {mode === 'search' ? (
            <>
              <button type="button" className="button active" onClick={() => setMode('search')}>탐색</button>
              <button type="button" className="button" onClick={enterRouteMode}>길찾기</button>
            </>
          ) : (
            <>
              <button type="button" className="button" onClick={exitRouteMode}>탐색</button>
              <button type="button" className="button active" onClick={() => setMode('route')}>길찾기</button>
            </>
          )}
          <button type="button" className="button" onClick={onBoardClickHandler}>커뮤니티</button>
          <button type="button" className="button" onClick={onUserClickHandler}>MY</button>
        </div>

        {/* 검색 영역 */}
        {mode === 'search' && (
          <>
            <div className="sidebar-search-input-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="장소, 주소 검색"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
                />
                <div className="search-icon" onClick={onSearchClick} role="button" tabIndex={0}>
                  <div className="icon search-light-icon" />
                </div>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="search-result-list">
                {searchResults.map((place, index) => (
                  <div
                    key={place.id || `${place.place_name}-${index}`}
                    className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                    onClick={() => onClickItem(place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onClickItem(place); }}
                  >
                    <div className="place-name">{place.place_name}</div>
                    <div className="place-address">{place.road_address_name || place.address_name}</div>
                    {place.phone && <div className="place-phone">{place.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 길찾기 영역 (탭 아래 표현) */}
        {mode === 'route' && (
          <div className="route-only-wrap">
            <form className="route-form" onSubmit={submitRoute}>
              {/* 출발지 */}
              <div className="route-field">
                <div className="route-input-wrap">
                  <input
                    type="text"
                    placeholder="출발지 입력 (장소 선택 필수)"
                    value={routeQuery.start}
                    onChange={(e) => onRouteChange('start', e.target.value)}
                    onFocus={() => routeQuery.start && setOpenDrop((o) => ({ ...o, start: true }))}
                  />
                  {/* {picked.start && <span className="route-valid" aria-label="selected">✓</span>} */}
                </div>

                {openDrop.start && suggestions.start.length > 0 && (
                  <ul className="route-suggest" role="listbox">
                    {suggestions.start.map((s) => (
                      <li
                        key={s.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion('start', s)}
                        role="option"
                      >
                        <div className="sg-name">{s.place_name}</div>
                        <div className="sg-addr">{s.road_address_name || s.address_name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 도착지 */}
              <div className="route-field">
                <div className="route-input-wrap">
                  <input
                    type="text"
                    placeholder="도착지 입력 (장소 선택 필수)"
                    value={routeQuery.end}
                    onChange={(e) => onRouteChange('end', e.target.value)}
                    onFocus={() => routeQuery.end && setOpenDrop((o) => ({ ...o, end: true }))}
                  />
                  {/* {picked.end && <span className="route-valid" aria-label="selected">✓</span>} */}
                </div>

                {openDrop.end && suggestions.end.length > 0 && (
                  <ul className="route-suggest" role="listbox">
                    {suggestions.end.map((s) => (
                      <li
                        key={s.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion('end', s)}
                        role="option"
                      >
                        <div className="sg-name">{s.place_name}</div>
                        <div className="sg-addr">{s.road_address_name || s.address_name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="submit" className="route-submit" disabled={!canSubmit}>
                경로 보기
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

