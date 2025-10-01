// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import './style.css';
// import { useNavigate } from 'react-router-dom';
// import { BOARD_PATH, USER_PATH } from 'constant';

// declare global {
//   interface Window { kakao: any; }
// }
// const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

// interface Place {
//   id: string;
//   place_name: string;
//   x: string; // lng
//   y: string; // lat
//   address_name?: string;
//   road_address_name?: string;
//   category_name?: string;
//   phone?: string;
// }

// export interface CoordsPick {
//   lat: number;
//   lng: number;
//   name: string;
// }

// interface RoutePlace {
//   name: string;
//   lat: number | string;
//   lng: number | string;
//   address?: string;
//   roadAddress?: string;
//   phone?: string;
// }

// interface SearchSidebarProps {
//   searchResults: Place[];
//   onClickItem: (place: Place) => void;
//   selectedIndex: number | null;
//   isOpen: boolean;
//   toggleOpen: () => void;

//   // 일반 검색
//   onSearch: (start: string, goal: string) => void;

//   // 길찾기
//   onRouteByCoords?: (start: CoordsPick, end: CoordsPick) => void;
//   onRouteSearch?: (startKeyword: string, endKeyword: string) => void;

//   // 경로 주변 맛집
//   routePlaces?: RoutePlace[];
//   routeLoading?: boolean;
//   routeError?: string | null;
//   onFocusRoutePlace?: (p: RoutePlace) => void;
// }

// export default function SearchSidebar({
//   isOpen,
//   toggleOpen,
//   searchResults,
//   onClickItem,
//   selectedIndex,
//   onSearch,
//   onRouteByCoords,
//   onRouteSearch,
//   routePlaces,
//   routeLoading,
//   routeError,
//   onFocusRoutePlace,
// }: SearchSidebarProps) {
//   const navigate = useNavigate();

//   const [mode, setMode] = useState<'search' | 'route'>('search');
//   const enterRouteMode = () => setMode('route');
//   const exitRouteMode = () => setMode('search');

//   // ===== 검색 =====
//   const [keyword, setKeyword] = useState('');
//   const onSearchClick = () => {
//     const q = keyword.trim();
//     if (!q) return;
//     onSearch(q, '');
//   };

//   // ===== 길찾기(자동완성) =====
//   type Field = 'start' | 'end';
//   const [routeQuery, setRouteQuery] = useState({ start: '', end: '' });
//   const [picked, setPicked] = useState<{ start: CoordsPick | null; end: CoordsPick | null }>({
//     start: null, end: null,
//   });
//   const [suggestions, setSuggestions] = useState<{ start: Place[]; end: Place[] }>({ start: [], end: [] });
//   const [openDrop, setOpenDrop] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });

//   // 선택 직후 재노출 방지 플래그
//   const [suppressDrop, setSuppressDrop] = useState<{ start: boolean; end: boolean }>({
//     start: false, end: false,
//   });

//   // refs
//   const routeQueryRef = useRef(routeQuery);
//   useEffect(() => { routeQueryRef.current = routeQuery; }, [routeQuery]);

//   const suppressDropRef = useRef(suppressDrop);
//   useEffect(() => { suppressDropRef.current = suppressDrop; }, [suppressDrop]);

//   const pickedRef = useRef(picked);
//   useEffect(() => { pickedRef.current = picked; }, [picked]);

//   const lastQueryRef = useRef<{ start: string; end: string }>({ start: '', end: '' });

//   const places = useMemo(() => {
//     return kakao?.maps?.services ? new kakao.maps.services.Places() : null;
//   }, []);

//   const timerRef = useRef<number | null>(null);
//   const clearTimer = () => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } };
//   useEffect(() => clearTimer, []);

//   const debouncedSearch = (field: Field, q: string) => {
//     if (!places) return;
//     clearTimer();
//     const qTrim = q.trim();
//     timerRef.current = window.setTimeout(() => {
//       if (!qTrim) {
//         setSuggestions((s) => ({ ...s, [field]: [] }));
//         return;
//       }

//       lastQueryRef.current[field] = qTrim;

//       places.keywordSearch(qTrim, (data: any[], status: string) => {
//         if (suppressDropRef.current[field]) return;
//         if (lastQueryRef.current[field] !== qTrim) return;
//         if ((pickedRef.current as any)[field]) return;

//         if (status === kakao.maps.services.Status.OK) {
//           const list: Place[] = data.map((d: any) => ({
//             id: d.id, place_name: d.place_name, x: d.x, y: d.y,
//             address_name: d.address_name, road_address_name: d.road_address_name,
//             phone: d.phone, category_name: d.category_name,
//           }));
//           setSuggestions((s) => ({ ...s, [field]: list }));
//           setOpenDrop((o) => ({ ...o, [field]: true }));
//         } else {
//           setSuggestions((s) => ({ ...s, [field]: [] }));
//           setOpenDrop((o) => ({ ...o, [field]: false }));
//         }
//       });
//     }, 250);
//   };

//   const onRouteChange = (field: Field, v: string) => {
//     setRouteQuery((q) => ({ ...q, [field]: v }));
//     setPicked((p) => ({ ...p, [field]: null }));
//     setSuppressDrop((s) => ({ ...s, [field]: false }));
//     if (v.trim()) debouncedSearch(field, v);
//     else { setSuggestions((s) => ({ ...s, [field]: [] })); setOpenDrop((o) => ({ ...o, [field]: false })); }
//   };

//   const pickSuggestion = (field: Field, p: Place) => {
//     const item: CoordsPick = { name: p.place_name, lat: parseFloat(p.y), lng: parseFloat(p.x) };
//     setPicked((prev) => ({ ...prev, [field]: item }));
//     setRouteQuery((q) => ({ ...q, [field]: `${p.place_name} (${p.road_address_name || p.address_name || ''})` }));
//     setSuggestions((s) => ({ ...s, [field]: [] }));
//     setOpenDrop((o) => ({ ...o, [field]: false }));
//     setSuppressDrop((s) => ({ ...s, [field]: true }));
//     clearTimer();
//   };

//   const canSubmit = !!picked.start && !!picked.end;
//   const submitRoute = (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (!canSubmit) return;
//     if (onRouteByCoords) onRouteByCoords(picked.start!, picked.end!);
//     else if (onRouteSearch) onRouteSearch(picked.start!.name, picked.end!.name);
//   };

//   // 외부 클릭/ESC 시 드롭다운 닫기
//   const containerRef = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     const onDocClick = (e: MouseEvent) => {
//       if (!containerRef.current) return;
//       if (!containerRef.current.contains(e.target as Node)) setOpenDrop({ start: false, end: false });
//     };
//     const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDrop({ start: false, end: false }); };
//     document.addEventListener('mousedown', onDocClick);
//     document.addEventListener('keydown', onEsc);
//     return () => {
//       document.removeEventListener('mousedown', onDocClick);
//       document.removeEventListener('keydown', onEsc);
//     };
//   }, []);

//   const onBoardClickHandler = () => navigate(BOARD_PATH());
//   const onUserClickHandler = () => navigate(USER_PATH(''));

//   return (
//     <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
//       {/* 열기/닫기 */}
//       <div className="slideBtnContainer">
//         <div className={`slideBtn ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
//           <div className="icon-box">
//             <div className={`icon ${isOpen ? 'expand-left-icon' : 'expand-right-icon'}`} />
//           </div>
//         </div>
//       </div>

//       <div className="sidebar-content" ref={containerRef}>
//         <div className="sidebar-title" />

//         {/* 탭 */}
//         <div className="button-group">
//           {mode === 'search' ? (
//             <>
//               <button type="button" className="button active" onClick={() => setMode('search')}>탐색</button>
//               <button type="button" className="button" onClick={enterRouteMode}>길찾기</button>
//             </>
//           ) : (
//             <>
//               <button type="button" className="button" onClick={exitRouteMode}>탐색</button>
//               <button type="button" className="button active" onClick={() => setMode('route')}>길찾기</button>
//             </>
//           )}
//           <button type="button" className="button" onClick={onBoardClickHandler}>커뮤니티</button>
//           <button type="button" className="button" onClick={onUserClickHandler}>MY</button>
//         </div>

//         {/* 검색 */}
//         {mode === 'search' && (
//           <>
//             <div className="sidebar-search-input-box">
//               <div className="search-input-wrapper">
//                 <input
//                   type="text"
//                   placeholder="장소, 주소 검색"
//                   value={keyword}
//                   onChange={(e) => setKeyword(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
//                 />
//                 <div className="search-icon" onClick={onSearchClick} role="button" tabIndex={0}>
//                   <div className="icon search-light-icon" />
//                 </div>
//               </div>
//             </div>

//             {/* 탐색 탭 결과 */}
//             {searchResults.length > 0 && (
//               <div className="list-rounded">
//                 <div className="list-scroll search-list-scroll">
//                   {searchResults.map((place, index) => (
//                     <div
//                       key={place.id || `${place.place_name}-${index}`}
//                       className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
//                       onClick={() => onClickItem(place)}                      // 단일 클릭: 선택/강조
//                       onDoubleClick={() => onClickItem(place)}                // 더블클릭: 탐색 탭에서도 이동/포커스 유지
//                       onMouseDown={(e) => e.preventDefault()}                 // 더블클릭 텍스트 선택 방지
//                       role="button"
//                       tabIndex={0}
//                       onKeyDown={(e) => { if (e.key === 'Enter') onClickItem(place); }}
//                     >
//                       <div className="place-name">{place.place_name}</div>
//                       <div className="place-address">{place.road_address_name || place.address_name}</div>
//                       {place.phone && <div className="place-phone">{place.phone}</div>}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {/* 길찾기 */}
//         {mode === 'route' && (
//           <div className="route-only-wrap">
//             <form className="route-form" onSubmit={submitRoute}>
//               {/* 출발지 */}
//               <div className="route-field">
//                 <div className="route-input-wrap">
//                   <input
//                     type="text"
//                     placeholder="출발지 입력 (장소 선택 필수)"
//                     value={routeQuery.start}
//                     onChange={(e) => onRouteChange('start', e.target.value)}
//                     onFocus={() => routeQuery.start && !suppressDrop.start && setOpenDrop((o) => ({ ...o, start: true }))}
//                   />
//                 </div>
//                 {openDrop.start && suggestions.start.length > 0 && (
//                   <ul className="route-suggest" role="listbox">
//                     {suggestions.start.map((s) => (
//                       <li
//                         key={s.id}
//                         onMouseDown={(e) => e.preventDefault()}
//                         onClick={() => pickSuggestion('start', s)}
//                         role="option"
//                       >
//                         <div className="sg-name">{s.place_name}</div>
//                         <div className="sg-addr">{s.road_address_name || s.address_name}</div>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* 도착지 */}
//               <div className="route-field">
//                 <div className="route-input-wrap">
//                   <input
//                     type="text"
//                     placeholder="도착지 입력 (장소 선택 필수)"
//                     value={routeQuery.end}
//                     onChange={(e) => onRouteChange('end', e.target.value)}
//                     onFocus={() => routeQuery.end && !suppressDrop.end && setOpenDrop((o) => ({ ...o, end: true }))}
//                   />
//                 </div>
//                 {openDrop.end && suggestions.end.length > 0 && (
//                   <ul className="route-suggest" role="listbox">
//                     {suggestions.end.map((s) => (
//                       <li
//                         key={s.id}
//                         onMouseDown={(e) => e.preventDefault()}
//                         onClick={() => pickSuggestion('end', s)}
//                         role="option"
//                       >
//                         <div className="sg-name">{s.place_name}</div>
//                         <div className="sg-addr">{s.road_address_name || s.address_name}</div>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               <button type="submit" className="route-submit" disabled={!canSubmit}>
//                 경로 보기
//               </button>
//             </form>

//             {/* 경로 주변 맛집 리스트 */}
//             <div className="route-places-wrap">
//               {routeLoading && <div className="muted">경로 주변 맛집 검색 중…</div>}
//               {!routeLoading && routeError && <div className="error">{routeError}</div>}

//               {!routeLoading && !routeError && routePlaces && routePlaces.length > 0 && (
//                 <div className="list-rounded route-list">
//                   <div className="list-scroll route-list-scroll">
//                     {routePlaces.map((p, idx) => {
//                       const lat = typeof (p as any).lat === 'string' ? parseFloat((p as any).lat) : (p as any).lat;
//                       const lng = typeof (p as any).lng === 'string' ? parseFloat((p as any).lng) : (p as any).lng;
//                       const canFocus = Number.isFinite(lat) && Number.isFinite(lng);

//                       return (
//                         <div
//                           key={`${p.name}-${idx}`}
//                           className="search-result-item"
//                           onClick={() => {
//                             // 단일 클릭: 선택 강조만 (필요 시 상태 추가)
//                           }}
//                           onDoubleClick={() => canFocus && onFocusRoutePlace?.({ ...p, lat, lng })} // ★ 더블클릭 → 지도 이동 + 라벨 오픈
//                           onMouseDown={(e) => e.preventDefault()} // 더블클릭 텍스트 선택 방지
//                           role="button"
//                           tabIndex={0}
//                           onKeyDown={(e) => { if (e.key === 'Enter' && canFocus) onFocusRoutePlace?.({ ...p, lat, lng }); }}
//                         >
//                           <div className="place-name">{p.name}</div>
//                           <div className="place-address">{p.roadAddress || p.address || ''}</div>
//                           {p.phone && <div className="place-phone">{p.phone}</div>}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}

//               {!routeLoading && !routeError && (!routePlaces || routePlaces.length === 0) && (
//                 <div className="muted">경로 주변에서 표시할 맛집이 없습니다.</div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { BOARD_PATH, USER_PATH } from 'constant';

declare global { interface Window { kakao: any; } }
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

export interface CoordsPick { lat: number; lng: number; name: string; }

interface RoutePlace {
  name: string;
  lat: number | string;
  lng: number | string;
  address?: string;
  roadAddress?: string;
  phone?: string;
}

interface SearchSidebarProps {
  searchResults: Place[];
  onClickItem: (place: Place) => void;
  selectedIndex: number | null;
  isOpen: boolean;
  toggleOpen: () => void;

  // 일반 검색
  onSearch: (start: string, goal: string) => void;

  // 길찾기
  onRouteByCoords?: (start: CoordsPick, end: CoordsPick) => void;
  onRouteSearch?: (startKeyword: string, endKeyword: string) => void;

  // 경로 주변 맛집
  routePlaces?: RoutePlace[];
  routeLoading?: boolean;
  routeError?: string | null;
  onFocusRoutePlace?: (p: RoutePlace) => void;
}

/** 좌우 양방향 화살표(스왑) */
function SwapIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7h10l-3-3M17 17H7l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** X 아이콘 */
function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
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
  routePlaces,
  routeLoading,
  routeError,
  onFocusRoutePlace,
}: SearchSidebarProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'search' | 'route'>('search');

  // ====== 탐색 탭 ======
  const [keyword, setKeyword] = useState('');
  const onSearchClick = () => {
    const q = keyword.trim();
    if (!q) return;
    onSearch(q, '');
  };

  // ====== 길찾기 탭(자동완성) ======
  type Field = 'start' | 'end';
  const [routeQuery, setRouteQuery] = useState({ start: '', end: '' });
  const [picked, setPicked] = useState<{ start: CoordsPick | null; end: CoordsPick | null }>({ start: null, end: null });
  const [suggestions, setSuggestions] = useState<{ start: Place[]; end: Place[] }>({ start: [], end: [] });
  const [openDrop, setOpenDrop] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });
  const [suppressDrop, setSuppressDrop] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });

  const routeQueryRef = useRef(routeQuery); useEffect(()=>{ routeQueryRef.current = routeQuery; },[routeQuery]);
  const pickedRef = useRef(picked); useEffect(()=>{ pickedRef.current = picked; },[picked]);
  const suppressDropRef = useRef(suppressDrop); useEffect(()=>{ suppressDropRef.current = suppressDrop; },[suppressDrop]);

  const lastQueryRef = useRef<{ start: string; end: string }>({ start: '', end: '' });

  const places = useMemo(() => (kakao?.maps?.services ? new kakao.maps.services.Places() : null), []);
  const timerRef = useRef<number | null>(null);
  const clearTimer = () => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } };
  useEffect(()=>clearTimer, []);

  const debouncedSearch = (field: Field, q: string) => {
    if (!places) return;
    clearTimer();
    const qTrim = q.trim();
    timerRef.current = window.setTimeout(() => {
      if (!qTrim) { setSuggestions((s)=>({ ...s, [field]: [] })); return; }
      lastQueryRef.current[field] = qTrim;

      places.keywordSearch(qTrim, (data: any[], status: string) => {
        if (suppressDropRef.current[field]) return;
        if (lastQueryRef.current[field] !== qTrim) return;
        if ((pickedRef.current as any)[field]) return;

        if (status === kakao.maps.services.Status.OK) {
          const list: Place[] = data.map((d:any)=>({
            id:d.id, place_name:d.place_name, x:d.x, y:d.y,
            address_name:d.address_name, road_address_name:d.road_address_name,
            phone:d.phone, category_name:d.category_name
          }));
          setSuggestions((s)=>({ ...s, [field]: list }));
          setOpenDrop((o)=>({ ...o, [field]: true }));
        } else {
          setSuggestions((s)=>({ ...s, [field]: [] }));
          setOpenDrop((o)=>({ ...o, [field]: false }));
        }
      });
    }, 250);
  };

  const onRouteChange = (field: Field, v: string) => {
    setRouteQuery((q)=>({ ...q, [field]: v }));
    setPicked((p)=>({ ...p, [field]: null }));
    setSuppressDrop((s)=>({ ...s, [field]: false }));
    if (v.trim()) debouncedSearch(field, v);
    else { setSuggestions((s)=>({ ...s, [field]: [] })); setOpenDrop((o)=>({ ...o, [field]: false })); }
  };

  const pickSuggestion = (field: Field, p: Place) => {
    const item: CoordsPick = { name: p.place_name, lat: parseFloat(p.y), lng: parseFloat(p.x) };
    setPicked(prev=>({ ...prev, [field]: item }));
    setRouteQuery(q=>({ ...q, [field]: `${p.place_name} (${p.road_address_name || p.address_name || ''})` }));
    setSuggestions(s=>({ ...s, [field]: [] }));
    setOpenDrop(o=>({ ...o, [field]: false }));
    setSuppressDrop(s=>({ ...s, [field]: true }));
    clearTimer();
  };

  const canSubmit = !!picked.start && !!picked.end;
  const submitRoute = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    if (onRouteByCoords) onRouteByCoords(picked.start!, picked.end!);
    else if (onRouteSearch) onRouteSearch(picked.start!.name, picked.end!.name);
  };

  // 출발/도착 스왑
  const swapEndpoints = () => {
    setRouteQuery(q=>({ start: q.end, end: q.start }));
    setPicked(p=>({ start: p.end, end: p.start }));
    setOpenDrop({ start:false, end:false });
    setSuggestions({ start:[], end:[] });
    setSuppressDrop({ start:true, end:true });

    // 모두 선택된 상태였다면 즉시 재검색
    const s = pickedRef.current.end;
    const e = pickedRef.current.start;
    if (s && e) {
      if (onRouteByCoords) onRouteByCoords(s, e);
      else if (onRouteSearch) onRouteSearch(s.name, e.name);
    }
  };

  // 둘 다 초기화
  const clearBoth = () => {
    setRouteQuery({ start:'', end:'' });
    setPicked({ start:null, end:null });
    setOpenDrop({ start:false, end:false });
    setSuggestions({ start:[], end:[] });
    setSuppressDrop({ start:false, end:false });
  };

  // 외부 클릭으로 제안 닫기
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpenDrop({ start:false, end:false });
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDrop({ start:false, end:false }); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const onBoardClickHandler = () => navigate(BOARD_PATH());
  const onUserClickHandler = () => navigate(USER_PATH(''));

  // ---- 레이아웃용 상수 (원하는 비율로 쉽게 튜닝) ----
  const ROW_HEIGHT = 42;       // 인풋 높이
  const ICON_BTN = 30;         // 인풋 안쪽 버튼(스왑/X) 크기
  const GAP_BETWEEN = 6;       // 출발지/도착지 사이 간격 (요청: 거의 없음 → 6px)
  const PADDING_RIGHT = ICON_BTN + 12; // 인풋 오른쪽 여백(아이콘 차지 공간)

  return (
    <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
      {/* 열기/닫기 */}
      <div className="slideBtnContainer">
        <div className={`slideBtn ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
          <div className="icon-box"><div className={`icon ${isOpen ? 'expand-left-icon' : 'expand-right-icon'}`} /></div>
        </div>
      </div>

      <div className="sidebar-content" ref={containerRef}>
        <div className="sidebar-title" />

        {/* 탭 */}
        <div className="button-group">
          {mode === 'search' ? (
            <>
              <button type="button" className="button active" onClick={()=>setMode('search')}>탐색</button>
              <button type="button" className="button" onClick={()=>setMode('route')}>길찾기</button>
            </>
          ) : (
            <>
              <button type="button" className="button" onClick={()=>setMode('search')}>탐색</button>
              <button type="button" className="button active" onClick={()=>setMode('route')}>길찾기</button>
            </>
          )}
          <button type="button" className="button" onClick={onBoardClickHandler}>커뮤니티</button>
          <button type="button" className="button" onClick={onUserClickHandler}>MY</button>
        </div>

        {/* 탐색 탭 */}
        {mode === 'search' && (
          <>
            <div className="sidebar-search-input-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="장소, 주소 검색"
                  value={keyword}
                  onChange={(e)=>setKeyword(e.target.value)}
                  onKeyDown={(e)=> e.key==='Enter' && onSearchClick()}
                />
                <div className="search-icon" onClick={onSearchClick} role="button" tabIndex={0}>
                  <div className="icon search-light-icon" />
                </div>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="list-rounded">
                <div className="list-scroll search-list-scroll">
                  {searchResults.map((place, index) => (
                    <div
                      key={place.id || `${place.place_name}-${index}`}
                      className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                      onClick={()=>onClickItem(place)}
                      onDoubleClick={()=>onClickItem(place)}
                      onMouseDown={(e)=>e.preventDefault()}
                      role="button" tabIndex={0}
                      onKeyDown={(e)=>{ if (e.key==='Enter') onClickItem(place); }}
                    >
                      <div className="place-name">{place.place_name}</div>
                      <div className="place-address">{place.road_address_name || place.address_name}</div>
                      {place.phone && <div className="place-phone">{place.phone}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 길찾기 탭 */}
        {mode === 'route' && (
          <div className="route-only-wrap">
            <form className="route-form" onSubmit={submitRoute}>
              {/* 출발지 */}
              <div
                className="route-field"
                style={{ position: 'relative', marginBottom: GAP_BETWEEN }}
              >
                <input
                  type="text"
                  placeholder="출발지를 입력하세요"
                  value={routeQuery.start}
                  onChange={(e)=>onRouteChange('start', e.target.value)}
                  onFocus={()=> routeQuery.start && !suppressDrop.start && setOpenDrop(o=>({ ...o, start:true }))}
                  style={{
                    width: '100%',
                    height: ROW_HEIGHT,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    padding: `0 ${PADDING_RIGHT}px 0 12px`,
                    outline: 'none',
                  }}
                />
                {/* 자동완성 */}
                {openDrop.start && suggestions.start.length > 0 && (
                  <ul
                    className="route-suggest"
                    role="listbox"
                    style={{
                      position: 'absolute',
                      zIndex: 5,
                      left: 0, right: 0, top: ROW_HEIGHT + 6,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      maxHeight: 220,
                      overflow: 'auto'
                    }}
                  >
                    {suggestions.start.map((s)=>(
                      <li
                        key={s.id}
                        onMouseDown={(e)=>e.preventDefault()}
                        onClick={()=>pickSuggestion('start', s)}
                        role="option"
                        style={{ padding: '10px 12px', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 14 }}>{s.place_name}</div>
                        <div style={{ fontSize: 12, opacity: .7 }}>{s.road_address_name || s.address_name}</div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 출발지 오른쪽: 스왑 버튼 */}
                <button
                  type="button"
                  onClick={swapEndpoints}
                  aria-label="출발지와 도착지 바꾸기"
                  title="출발/도착 바꾸기"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: ICON_BTN,
                    height: ICON_BTN,
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#374151',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                  }}
                >
                  <SwapIcon size={18} />
                </button>
              </div>

              {/* 도착지 */}
              <div className="route-field" style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="도착지를 입력하세요"
                  value={routeQuery.end}
                  onChange={(e)=>onRouteChange('end', e.target.value)}
                  onFocus={()=> routeQuery.end && !suppressDrop.end && setOpenDrop(o=>({ ...o, end:true }))}
                  style={{
                    width: '100%',
                    height: ROW_HEIGHT,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    padding: `0 ${PADDING_RIGHT}px 0 12px`,
                    outline: 'none',
                  }}
                />
                {/* 자동완성 */}
                {openDrop.end && suggestions.end.length > 0 && (
                  <ul
                    className="route-suggest"
                    role="listbox"
                    style={{
                      position: 'absolute',
                      zIndex: 5,
                      left: 0, right: 0, top: ROW_HEIGHT + 6,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      maxHeight: 220,
                      overflow: 'auto'
                    }}
                  >
                    {suggestions.end.map((s)=>(
                      <li
                        key={s.id}
                        onMouseDown={(e)=>e.preventDefault()}
                        onClick={()=>pickSuggestion('end', s)}
                        role="option"
                        style={{ padding: '10px 12px', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 14 }}>{s.place_name}</div>
                        <div style={{ fontSize: 12, opacity: .7 }}>{s.road_address_name || s.address_name}</div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 도착지 오른쪽: X(둘 다 초기화) */}
                <button
                  type="button"
                  onClick={clearBoth}
                  aria-label="출발지와 도착지 지우기"
                  title="모두 지우기"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: ICON_BTN,
                    height: ICON_BTN,
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#374151',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                  }}
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <button type="submit" className="route-submit" disabled={!canSubmit} style={{ marginTop: 10 }}>
                경로 보기
              </button>
            </form>

            {/* 주변 맛집 리스트 */}
            <div className="route-places-wrap">
              {routeLoading && <div className="muted">경로 주변 맛집 검색 중…</div>}
              {!routeLoading && routeError && <div className="error">{routeError}</div>}
              {!routeLoading && !routeError && routePlaces && routePlaces.length > 0 && (
                <div className="list-rounded route-list">
                  <div className="list-scroll route-list-scroll">
                    {routePlaces.map((p, idx) => {
                      const lat = typeof (p as any).lat === 'string' ? parseFloat((p as any).lat) : (p as any).lat;
                      const lng = typeof (p as any).lng === 'string' ? parseFloat((p as any).lng) : (p as any).lng;
                      const canFocus = Number.isFinite(lat) && Number.isFinite(lng);
                      return (
                        <div
                          key={`${p.name}-${idx}`}
                          className="search-result-item"
                          onDoubleClick={()=> canFocus && onFocusRoutePlace?.({ ...p, lat, lng })}
                          onMouseDown={(e)=>e.preventDefault()}
                          role="button" tabIndex={0}
                          onKeyDown={(e)=>{ if (e.key === 'Enter' && canFocus) onFocusRoutePlace?.({ ...p, lat, lng }); }}
                        >
                          <div className="place-name">{p.name}</div>
                          <div className="place-address">{p.roadAddress || p.address || ''}</div>
                          {p.phone && <div className="place-phone">{p.phone}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!routeLoading && !routeError && (!routePlaces || routePlaces.length === 0) && (
                <div className="muted">경로 주변에서 표시할 맛집이 없습니다.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
