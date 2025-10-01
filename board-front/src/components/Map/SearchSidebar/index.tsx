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
  const enterRouteMode = () => setMode('route');
  const exitRouteMode = () => setMode('search');

  // ===== 검색 =====
  const [keyword, setKeyword] = useState('');
  const onSearchClick = () => {
    const q = keyword.trim();
    if (!q) return;
    onSearch(q, '');
  };

  // ===== 길찾기(자동완성) =====
  type Field = 'start' | 'end';
  const [routeQuery, setRouteQuery] = useState({ start: '', end: '' });
  const [picked, setPicked] = useState<{ start: CoordsPick | null; end: CoordsPick | null }>({
    start: null, end: null,
  });
  const [suggestions, setSuggestions] = useState<{ start: Place[]; end: Place[] }>({ start: [], end: [] });
  const [openDrop, setOpenDrop] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });

  // 선택 직후 재노출 방지 플래그
  const [suppressDrop, setSuppressDrop] = useState<{ start: boolean; end: boolean }>({
    start: false, end: false,
  });

  // refs
  const routeQueryRef = useRef(routeQuery);
  useEffect(() => { routeQueryRef.current = routeQuery; }, [routeQuery]);

  const suppressDropRef = useRef(suppressDrop);
  useEffect(() => { suppressDropRef.current = suppressDrop; }, [suppressDrop]);

  const pickedRef = useRef(picked);
  useEffect(() => { pickedRef.current = picked; }, [picked]);

  const lastQueryRef = useRef<{ start: string; end: string }>({ start: '', end: '' });

  const places = useMemo(() => {
    return kakao?.maps?.services ? new kakao.maps.services.Places() : null;
  }, []);

  const timerRef = useRef<number | null>(null);
  const clearTimer = () => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } };
  useEffect(() => clearTimer, []);

  const debouncedSearch = (field: Field, q: string) => {
    if (!places) return;
    clearTimer();
    const qTrim = q.trim();
    timerRef.current = window.setTimeout(() => {
      if (!qTrim) {
        setSuggestions((s) => ({ ...s, [field]: [] }));
        return;
      }

      lastQueryRef.current[field] = qTrim;

      places.keywordSearch(qTrim, (data: any[], status: string) => {
        if (suppressDropRef.current[field]) return;
        if (lastQueryRef.current[field] !== qTrim) return;
        if ((pickedRef.current as any)[field]) return;

        if (status === kakao.maps.services.Status.OK) {
          const list: Place[] = data.map((d: any) => ({
            id: d.id, place_name: d.place_name, x: d.x, y: d.y,
            address_name: d.address_name, road_address_name: d.road_address_name,
            phone: d.phone, category_name: d.category_name,
          }));
          setSuggestions((s) => ({ ...s, [field]: list }));
          setOpenDrop((o) => ({ ...o, [field]: true }));
        } else {
          setSuggestions((s) => ({ ...s, [field]: [] }));
          setOpenDrop((o) => ({ ...o, [field]: false }));
        }
      });
    }, 250);
  };

  const onRouteChange = (field: Field, v: string) => {
    setRouteQuery((q) => ({ ...q, [field]: v }));
    setPicked((p) => ({ ...p, [field]: null }));
    setSuppressDrop((s) => ({ ...s, [field]: false }));
    if (v.trim()) debouncedSearch(field, v);
    else { setSuggestions((s) => ({ ...s, [field]: [] })); setOpenDrop((o) => ({ ...o, [field]: false })); }
  };

  const pickSuggestion = (field: Field, p: Place) => {
    const item: CoordsPick = { name: p.place_name, lat: parseFloat(p.y), lng: parseFloat(p.x) };
    setPicked((prev) => ({ ...prev, [field]: item }));
    setRouteQuery((q) => ({ ...q, [field]: `${p.place_name} (${p.road_address_name || p.address_name || ''})` }));
    setSuggestions((s) => ({ ...s, [field]: [] }));
    setOpenDrop((o) => ({ ...o, [field]: false }));
    setSuppressDrop((s) => ({ ...s, [field]: true }));
    clearTimer();
  };

  const canSubmit = !!picked.start && !!picked.end;
  const submitRoute = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    if (onRouteByCoords) onRouteByCoords(picked.start!, picked.end!);
    else if (onRouteSearch) onRouteSearch(picked.start!.name, picked.end!.name);
  };

  // 외부 클릭/ESC 시 드롭다운 닫기
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpenDrop({ start: false, end: false });
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDrop({ start: false, end: false }); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

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

        {/* 탭 */}
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

        {/* 검색 */}
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

            {/* 탐색 탭 결과 */}
            {searchResults.length > 0 && (
              <div className="list-rounded">
                <div className="list-scroll search-list-scroll">
                  {searchResults.map((place, index) => (
                    <div
                      key={place.id || `${place.place_name}-${index}`}
                      className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                      onClick={() => onClickItem(place)}                      // 단일 클릭: 선택/강조
                      onDoubleClick={() => onClickItem(place)}                // 더블클릭: 탐색 탭에서도 이동/포커스 유지
                      onMouseDown={(e) => e.preventDefault()}                 // 더블클릭 텍스트 선택 방지
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
              </div>
            )}
          </>
        )}

        {/* 길찾기 */}
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
                    onFocus={() => routeQuery.start && !suppressDrop.start && setOpenDrop((o) => ({ ...o, start: true }))}
                  />
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
                    onFocus={() => routeQuery.end && !suppressDrop.end && setOpenDrop((o) => ({ ...o, end: true }))}
                  />
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

            {/* 경로 주변 맛집 리스트 */}
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
                          onClick={() => {
                            // 단일 클릭: 선택 강조만 (필요 시 상태 추가)
                          }}
                          onDoubleClick={() => canFocus && onFocusRoutePlace?.({ ...p, lat, lng })} // ★ 더블클릭 → 지도 이동 + 라벨 오픈
                          onMouseDown={(e) => e.preventDefault()} // 더블클릭 텍스트 선택 방지
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' && canFocus) onFocusRoutePlace?.({ ...p, lat, lng }); }}
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
