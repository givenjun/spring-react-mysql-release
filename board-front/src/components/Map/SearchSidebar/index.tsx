// board-front/src/components/Map/SearchSidebar/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { AUTH_PATH, BOARD_PATH, USER_PATH } from 'constant';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hook';
import { getCookie } from 'utils';
import { useLoginUserStore } from 'stores';

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
  /** 🔥 카카오 place URL (미니뷰어/상세 이동용) */
  place_url?: string;
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

/** 사이드바 경로 카드 타입 */
interface RouteOptionItem {
  id: string;
  name: '빠른길' | '권장길' | '쉬운길';
  path: { lat: number; lng: number }[];
  timeSec: number;
  distanceM: number;
  complexity: number;
}

interface SearchSidebarProps {
  searchResults: Place[];
  onClickItem: (place: Place) => void;
  selectedIndex: number | null;
  isOpen: boolean;
  toggleOpen: () => void;

  // 일반 검색
  onSearch: (keyword: string) => void;

  /** 🔥 탐색 탭: 리스트에서 미니뷰어 열기용 (선택) */
  onOpenExploreMiniViewer?: (place: Place) => void;

  // 길찾기
  onRouteByCoords?: (start: CoordsPick, end: CoordsPick) => void;
  onRouteSearch?: (startKeyword: string, endKeyword: string) => void;

  // 경로 주변 맛집
  routePlaces?: RoutePlace[];
  routeLoading?: boolean;
  routeError?: string | null;
  onFocusRoutePlace?: (p: RoutePlace) => void;

  // 3경로 리스트
  routeOptions?: RouteOptionItem[];
  selectedRouteIdx?: number | null;
  onSelectRoute?: (index: number) => void | Promise<void>;
  onOpenRouteDetail?: (index: number) => void | Promise<void>;

  // 왼쪽 맛집 리스트 표시 여부(우측 상세 열리면 false로 넘겨 숨김)
  showRoutePlacesInSidebar?: boolean;

  /** (선택) 거리 제한 km – 기본은 20km */
  distanceLimitKm?: number;
  /** (선택) 허용 오차 비율 – 기본 0.05(±5%) */
  distanceToleranceRatio?: number;

  /** 🔥 Main 쪽 지도 모드 변경 콜백: 'explore' | 'route' */
  onChangeMapMode?: (mode: 'explore' | 'route') => void;
}

/** 거리 계산 (하버사인, km) */
function toRad(d: number) { return (d * Math.PI) / 180; }
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 좌우 양방향 화살표(스왑) */
function SwapIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7h10l-3-3M17 17H7l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** X 아이콘 */
function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 정보/경고 배너 */
function Banner({ type, children }: { type: 'info' | 'error'; children: React.ReactNode }) {
  const style = type === 'error'
    ? { borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' }
    : { borderColor: '#93c5fd', background: '#eff6ff', color: '#1e3a8a' };
  return (
    <div style={{ border: '1px solid', borderRadius: 8, padding: '8px 10px', fontSize: 13, ...style }}>
      {children}
    </div>
  );
}

export default function SearchSidebar({
  isOpen,
  toggleOpen,
  searchResults,
  onClickItem,
  selectedIndex,
  onSearch,
  onOpenExploreMiniViewer,
  onRouteByCoords,
  onRouteSearch,
  routePlaces,
  routeLoading,
  routeError,
  onFocusRoutePlace,

  // 3경로
  routeOptions = [],
  selectedRouteIdx = 0,
  onSelectRoute,
  onOpenRouteDetail,

  // 왼쪽 맛집 리스트 표시 여부 (기본 true)
  showRoutePlacesInSidebar = true,

  // 거리 제한 설정(기본 20km, 허용오차 ±5%)
  distanceLimitKm = 20,
  distanceToleranceRatio = 0.05,

  // 🔥 Main에 지도 모드 알려주는 콜백
  onChangeMapMode,
}: SearchSidebarProps) {
  const navigate = useNavigate();
  const { loginUser } = useLoginUserStore();

  // 내부 탭 상태: search(탐색) | route(길찾기)
  const [mode, setMode] = useState<'search' | 'route'>('search');

  const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

  // 🔥 탭 전환 헬퍼: 내부 mode + 부모 mapMode 동기화
  const switchMode = (next: 'search' | 'route') => {
    setMode(next);
    if (next === 'search') onChangeMapMode?.('explore'); // 탐색 → 지도는 explore 모드
    else onChangeMapMode?.('route');                     // 길찾기 → route 모드
  };

  // ====== 탐색 탭 ======
  const [keyword, setKeyword] = useState('');

  // 🔹 공백 + 엔터 → 초기화 신호(onSearch('')) 보내기
  const onSearchClick = () => {
    const q = keyword.trim();

    if (!q) {
      // 공백 또는 빈 문자열이면: 입력창 비우고 "초기화" 의미로 빈 문자열 전달
      setKeyword('');
      onSearch('');
      return;
    }

    onSearch(q);
  };

  // ====== 길찾기 탭 (자동완성: 입력 시 디바운스 검색, 클릭으로 확정) ======
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
  const [openDrop, setOpenDrop] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });

  // ✅ 거리 제한 메시지 상태
  const [distanceInfo, setDistanceInfo] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const routeQueryRef = useRef(routeQuery);
  useEffect(() => { routeQueryRef.current = routeQuery; }, [routeQuery]);
  const pickedRef = useRef(picked);
  useEffect(() => { pickedRef.current = picked; }, [picked]);

  const { searchManyOnce } = useKakaoSearch();

  // 🔥 디바운스 타이머 (출발/도착 각각)
  const debounceRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current.start !== null) window.clearTimeout(debounceRef.current.start);
      if (debounceRef.current.end !== null) window.clearTimeout(debounceRef.current.end);
    };
  }, []);

  // 실제 검색 실행 함수
  const triggerSuggestions = async (field: Field, keyword: string) => {
    const q = keyword.trim();
    if (q.length < 2) {
      // 2글자 미만이면 목록 닫기
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setOpenDrop(prev => ({ ...prev, [field]: false }));
      return;
    }
    const list = await searchManyOnce(q, 12);
    setSuggestions(prev => ({ ...prev, [field]: list }));
    setOpenDrop(prev => ({ ...prev, [field]: list.length > 0 }));
  };

  // 입력 시 디바운스 검색
  const debouncedSearch = (field: Field, value: string) => {
    // 이전 타이머 제거
    const prevTimer = debounceRef.current[field];
    if (prevTimer !== null) {
      window.clearTimeout(prevTimer);
    }

    const trimmed = value.trim();

    // 2글자 미만이면 바로 목록 정리
    if (trimmed.length < 2) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setOpenDrop(prev => ({ ...prev, [field]: false }));
      debounceRef.current[field] = null;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      triggerSuggestions(field, trimmed);
    }, 300); // 300ms 디바운스
    debounceRef.current[field] = timeoutId;
  };

  const onRouteChange = (field: Field, v: string) => {
    setRouteQuery((q) => ({ ...q, [field]: v }));
    setPicked((p) => ({ ...p, [field]: null }));
    setDistanceInfo(null);

    // 🔥 입력만 해도 자동으로 추천 목록 검색
    debouncedSearch(field, v);
  };

  // ⌨️ 엔터 입력 시: 아무 동작도 하지 않도록 완전 차단
  const onKeyDownInput = (field: Field) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 모바일 "다음" 키도 여기로 들어옴
      return;
    }
  };

  // 목록에서 클릭하면 “확정”
  const pickSuggestion = (field: Field, p: Place) => {
    // 🔥 1) 이 필드에 걸려 있던 디바운스 타이머 제거
    const prevTimer = debounceRef.current[field];
    if (prevTimer !== null) {
      window.clearTimeout(prevTimer);
      debounceRef.current[field] = null;
    }

    // 2) 선택한 장소를 확정 값으로 반영
    const item: CoordsPick = {
      name: p.place_name,
      lat: parseFloat(p.y),
      lng: parseFloat(p.x),
    };
    setPicked(prev => ({ ...prev, [field]: item }));
    setRouteQuery(q => ({
      ...q,
      [field]: `${p.place_name} (${p.road_address_name || p.address_name || ''})`,
    }));

    // 3) 기존 추천 목록/드롭다운 정리
    setSuggestions(s => ({ ...s, [field]: [] }));
    setOpenDrop(o => ({ ...o, [field]: false }));
    setDistanceInfo(null);
  };

  const canSubmit = !!picked.start && !!picked.end;

  // ✅ 경로 보기(확정 두 개가 있어야 진행)
  const submitRoute = (e?: React.FormEvent) => {
    e?.preventDefault();
    const s = pickedRef.current.start;
    const t = pickedRef.current.end;
    if (!s || !t) return;

    const distKm = haversineKm({ lat: s.lat, lng: s.lng }, { lat: t.lat, lng: t.lng });
    const baseLimit = distanceLimitKm;
    const tol = Math.max(0, distanceToleranceRatio);
    const allowedKm = baseLimit * (1 + tol);

    if (distKm > allowedKm) {
      setDistanceInfo({
        type: 'error',
        text: `거리가 너무 멉니다! 제한 ${baseLimit.toFixed(1)}km (허용오차 +${Math.round(tol * 100)}% → ${allowedKm.toFixed(1)}km), 현재 ${distKm.toFixed(1)}km (＋${(distKm - baseLimit).toFixed(1)}km 초과)`,
      });
      return;
    }
    if (distKm > baseLimit && distKm <= allowedKm) {
      setDistanceInfo({
        type: 'info',
        text: `거리 제한 ${baseLimit.toFixed(1)}km를 살짝 초과했지만(현재 ${distKm.toFixed(1)}km), 허용오차 +${Math.round(tol * 100)}% 이내여서 계속 진행합니다.`,
      });
    } else {
      setDistanceInfo(null);
    }

    if (onRouteByCoords) onRouteByCoords(s, t);
    else if (onRouteSearch) onRouteSearch(s.name, t.name);
  };

  // 출발/도착 스왑(확정값도 같이 스왑)
  const swapEndpoints = () => {
    setRouteQuery(q => ({ start: q.end, end: q.start }));
    setPicked(p => ({ start: p.end, end: p.start }));
    setSuggestions({ start: [], end: [] });
    setOpenDrop({ start: false, end: false });
    setDistanceInfo(null);
  };

  // 둘 다 초기화
  const clearBoth = () => {
    setRouteQuery({ start: '', end: '' });
    setPicked({ start: null, end: null });
    setSuggestions({ start: [], end: [] });
    setOpenDrop({ start: false, end: false });
    setDistanceInfo(null);
  };

  // 외부 클릭으로 제안 닫기
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
  const onUserClickHandler = () => {
    const cookieToken = getCookie('accessToken');
    const localToken = localStorage.getItem('accessToken');
    const accessToken = cookieToken || localToken;

    if (!accessToken) {
      navigate(AUTH_PATH());
      return;
    }

    if (loginUser && loginUser.email) {
      navigate(USER_PATH(loginUser.email));
    } else {
      navigate(AUTH_PATH());
    }
  };

  // ---- 레이아웃 상수 ----
  const ROW_HEIGHT = 42;
  const ICON_BTN = 30;
  const GAP_BETWEEN = 6;
  const PADDING_RIGHT = ICON_BTN + 12;

  // ====== 3경로 리스트 포맷 ======
  const fmtTime = (sec: number) => {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}분`;
    const h = Math.floor(m / 60), mm = m % 60;
    return `${h}시간 ${mm}분`;
  };
  const fmtDist = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
  const fastest = useMemo(
    () => (routeOptions && routeOptions.length ? Math.min(...routeOptions.map(r => r.timeSec)) : 0),
    [routeOptions]
  );

  return (
    <>
      {/* 사이드바 본체 */}
      <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-content" ref={containerRef}>
          <div className="sidebar-title" onClick={() => window.location.reload()} />

          {/* 탭 */}
          <div className="button-group">
            {mode === 'search' ? (
              <>
                <button
                  type="button"
                  className="button active"
                  onClick={() => switchMode('search')}
                >
                  탐색
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => switchMode('route')}
                >
                  길찾기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button"
                  onClick={() => switchMode('search')}
                >
                  탐색
                </button>
                <button
                  type="button"
                  className="button active"
                  onClick={() => switchMode('route')}
                >
                  길찾기
                </button>
              </>
            )}
            <button type="button" className="button" onClick={onBoardClickHandler}>커뮤니티</button>
            <button type="button" className="button" onClick={onUserClickHandler}>MY</button>
          </div>

          {/* ✅ 거리 안내/제한 배너 */}
          {distanceInfo && (
            <div style={{ margin: '8px 0' }}>
              <Banner type={distanceInfo.type}>{distanceInfo.text}</Banner>
            </div>
          )}

          {/* 탐색 탭 */}
          {mode === 'search' && (
            <>
              <div className="sidebar-search-input-box">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="장소, 주소 검색(Enter를 누르면 초기화됩니다)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSearchClick();
                      }
                    }}
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
                        onClick={() => {
                          onClickItem(place);
                          // onOpenExploreMiniViewer?.(place);
                        }}
                        onDoubleClick={() => {
                          onClickItem(place);
                          onOpenExploreMiniViewer?.(place);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onClickItem(place);
                            onOpenExploreMiniViewer?.(place);
                          }
                        }}
                      >
                        <button
                          className="detail-view-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // 상위 li 클릭(미니뷰어/지도 이동) 막기
                            onOpenExploreMiniViewer?.(place);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </button>
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
              <div className="route-form">
                {/* 출발지 */}
                <div className="route-field" style={{ position: 'relative', marginBottom: GAP_BETWEEN }}>
                  <input
                    type="text"
                    placeholder="출발지"
                    value={routeQuery.start}
                    onChange={(e) => onRouteChange('start', e.target.value)}
                    onKeyDown={onKeyDownInput('start')}
                    className="route-input"
                  />
                  {/* 자동완성 목록 */}
                  {openDrop.start && suggestions.start.length > 0 && (
                    <ul
                      className="route-suggest"
                      role="listbox"
                      style={{
                        position: 'absolute',
                        zIndex: 5,
                        left: 0,
                        right: 0,
                        top: ROW_HEIGHT + 6,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        maxHeight: 220,
                        overflow: 'auto',
                      }}
                    >
                      {suggestions.start.map((s) => (
                        <li
                          key={s.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion('start', s)}
                          role="option"
                          style={{ padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: 14 }}>{s.place_name}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {s.road_address_name || s.address_name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 출발지 오른쪽: 스왑 */}
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
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    <SwapIcon size={18} />
                  </button>
                </div>

                {/* 도착지 */}
                <div className="route-field" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="도착지"
                    value={routeQuery.end}
                    onChange={(e) => onRouteChange('end', e.target.value)}
                    onKeyDown={onKeyDownInput('end')}
                    className="route-input"
                  />
                  {/* 자동완성 목록 */}
                  {openDrop.end && suggestions.end.length > 0 && (
                    <ul
                      className="route-suggest"
                      role="listbox"
                      style={{
                        position: 'absolute',
                        zIndex: 5,
                        left: 0,
                        right: 0,
                        top: ROW_HEIGHT + 6,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        maxHeight: 220,
                        overflow: 'auto',
                      }}
                    >
                      {suggestions.end.map((s) => (
                        <li
                          key={s.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion('end', s)}
                          role="option"
                          style={{ padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: 14 }}>{s.place_name}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {s.road_address_name || s.address_name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 도착지 오른쪽: X */}
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
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={submitRoute}
                  className="route-submit"
                  disabled={!canSubmit}
                  style={{ marginTop: 10 }}
                >
                  경로 보기
                </button>
              </div>


              {/* ▼ 경로보기 아래 3경로 리스트 */}
              {routeOptions && routeOptions.length > 0 && (
                <div
                  className="inline-route-options"
                  style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}
                >
                  {routeOptions.map((r, i) => {
                    const deltaMin = fastest
                      ? Math.max(0, Math.round((r.timeSec - fastest) / 60))
                      : 0;

                    const badge =
                      r.name === '빠른길'
                        ? '가장 빠름'
                        : r.name === '쉬운길'
                        ? '편안·안전'
                        : '균형 추천';

                    const selected =
                      selectedRouteIdx !== null &&
                      selectedRouteIdx !== undefined &&
                      i === selectedRouteIdx;
                    const isLoading = !!routeLoading;

                    // 기본 스타일
                    const baseStyle: React.CSSProperties = {
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid #e7e7e7',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 8,
                      background: '#fff',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: 'none',
                      opacity: 1,
                      transition:
                        'opacity 0.18s ease, border-color 0.18s ease',
                    };

                    // 선택된 카드 → 가볍게 반투명 처리
                    const selectedStyle: React.CSSProperties =
                      selected && !isLoading
                        ? {
                            opacity: 0.75,
                            borderColor: '#ccc',
                          }
                        : {};

                    // 로딩 중 → 더 흐리고 클릭 불가
                    const disabledStyle: React.CSSProperties = isLoading
                      ? {
                          opacity: 0.45,
                          background: '#f3f3f3',
                          borderColor: '#d1d5db',
                        }
                      : {};

                    return (
                      <button
                        key={r.id}
                        className={`item ${selected ? 'selected' : ''}`}
                        onClick={() => !isLoading && onSelectRoute?.(i)}
                        onDoubleClick={() => !isLoading && onOpenRouteDetail?.(i)}
                        disabled={isLoading}
                        title={`${r.name} · ${fmtTime(r.timeSec)} · ${fmtDist(r.distanceM)}`}
                        style={{
                          ...baseStyle,
                          ...selectedStyle,
                          ...disabledStyle,
                        }}
                      >
                        {/* 상단: 경로명 + 시간 */}
                        <div
                          className="row"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 600,
                            fontSize: 13,
                            color: '#111827',
                          }}
                        >
                          <span>{r.name}</span>
                          <span>{fmtTime(r.timeSec)}</span>
                        </div>

                        {/* 하단: 거리 + 빠른길 대비 + 배지 */}
                        <div
                          className="sub"
                          style={{
                            marginTop: 4,
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            color: '#666',
                            fontSize: 12,
                          }}
                        >
                          <span>{fmtDist(r.distanceM)}</span>
                          {deltaMin > 0 && <span>빠른길 대비 +{deltaMin}분</span>}

                          <span
                            className={`badge ${r.name}`}
                            style={{
                              marginLeft: 'auto',
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 999,
                              border: '1px solid',
                              borderColor:
                                r.name === '빠른길'
                                  ? '#ffaf00'
                                  : r.name === '권장길'
                                  ? '#8a2ea1'
                                  : '#3aa757',
                            }}
                          >
                            {badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  <div
                    className="muted"
                    style={{ fontSize: 12, color: '#888', marginTop: 2 }}
                  >
                    * 경로를 클릭하면 오른쪽 상세/맛집 패널이 열립니다.
                  </div>
                </div>
              )}

              {/* 주변 맛집 리스트 (좌측, 필요할 때만 사용) */}
              {showRoutePlacesInSidebar && (
                <div className="route-places-wrap">
                  {routeLoading && (
                    <div className="muted">경로 주변 맛집 검색 중…</div>
                  )}
                  {!routeLoading && routeError && (
                    <div className="error">{routeError}</div>
                  )}
                  {!routeLoading &&
                    !routeError &&
                    routePlaces &&
                    routePlaces.length > 0 && (
                      <div className="list-rounded route-list">
                        <div className="list-scroll route-list-scroll">
                          {routePlaces.map((p, idx) => {
                            const lat =
                              typeof (p as any).lat === 'string'
                                ? parseFloat((p as any).lat)
                                : (p as any).lat;
                            const lng =
                              typeof (p as any).lng === 'string'
                                ? parseFloat((p as any).lng)
                                : (p as any).lng;
                            const canFocus =
                              Number.isFinite(lat) && Number.isFinite(lng);
                            return (
                              <div
                                key={`${p.name}-${idx}`}
                                className="search-result-item"
                                onDoubleClick={() =>
                                  canFocus &&
                                  onFocusRoutePlace?.({ ...p, lat, lng })
                                }
                                onMouseDown={(e) => e.preventDefault()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && canFocus)
                                    onFocusRoutePlace?.({ ...p, lat, lng });
                                }}
                              >
                                <div className="place-name">{p.name}</div>
                                <div className="place-address">
                                  {p.roadAddress || p.address || ''}
                                </div>
                                {p.phone && (
                                  <div className="place-phone">{p.phone}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  {!routeLoading &&
                    !routeError &&
                    (!routePlaces || routePlaces.length === 0) && (
                      <div className="muted">
                        경로 주변에서 표시할 맛집이 없습니다.
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 열기/닫기 버튼: 사이드바 밖에서 항상 고정 */}
      <div className="slideBtnContainer">
        <div
          className={`slideBtn ${isOpen ? 'active' : ''}`}
          onClick={toggleOpen}
        >
          <div className="icon-box">
            <div
              className={`icon ${
                isOpen ? 'expand-left-icon' : 'expand-right-icon'
              }`}
            />
          </div>
        </div>
      </div>
    </>
  );
}