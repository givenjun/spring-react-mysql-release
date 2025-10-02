// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl } from 'react-kakao-maps-sdk';
// import { useNavigate, useLocation } from 'react-router-dom';
// import SearchSidebar from 'components/Map/SearchSidebar';
// import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
// import RelatedPostsSidebar from 'components/RelatedPostsSidebar';
// import { BoardListItem } from 'types/interface';
// import { getSearchBoardListRequest } from 'apis';
// import './style.css';

// // 상세 라우트 경로 (프로젝트 라우팅에 맞게 필요시 수정)
// const BOARD_DETAIL_PATH = '/board/detail';

// // 유틸
// function deg2rad(deg: number) { return deg * (Math.PI / 180); }
// function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
//   const R = 6371;
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a = Math.sin(dLat / 2) ** 2 +
//             Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//             Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }
// type LatLng = { lat: number; lng: number };

// // 응답 → BoardListItem[]
// function toBoardListItems(res: any): BoardListItem[] {
//   if (!res) return [];
//   const payload = (res && typeof res === 'object' && 'code' in res && 'data' in res) ? (res as any).data : res;

//   const list =
//     (Array.isArray(payload?.boardList) && payload.boardList) ||
//     (Array.isArray(payload?.searchList) && payload.searchList) ||
//     (Array.isArray(payload?.list) && payload.list) ||
//     (Array.isArray(payload?.result) && payload.result) ||
//     (Array.isArray(payload?.rows) && payload.rows) ||
//     (Array.isArray(payload?.data) && payload.data) ||
//     (Array.isArray(payload) && payload) ||
//     [];

//   return (list as any[]).map((it: any) => ({
//     boardNumber: it.boardNumber ?? it.id ?? it.board_id,
//     title: it.title ?? '(제목 없음)',
//     content: typeof it?.content === 'string'
//       ? it.content
//       : (typeof it?.text === 'string' ? it.text : ''),
//   })) as BoardListItem[];
// }

// export default function Main() {
//   const { searchResults, center, searchPlaces } = useKakaoSearch();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

//   // kakao map 인스턴스 (panTo 위해 필요)
//   const [map, setMap] = useState<kakao.maps.Map | null>(null);

//   // 일직선 거리
//   const [isDistanceMode, setIsDistanceMode] = useState(false);
//   const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
//   const [distanceKm, setDistanceKm] = useState<number | null>(null);

//   // 경로(보행자)
//   const [isRouteMode, setIsRouteMode] = useState(false);
//   const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
//   const [routePath, setRoutePath] = useState<LatLng[]>([]);
//   const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
//   const [routeLoading, setRouteLoading] = useState(false);
//   const [routeError, setRouteError] = useState<string | null>(null);

//   // 연관 게시물
//   const [showRelatedPosts, setShowRelatedPosts] = useState(false);
//   const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
//   const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
//   const [relatedLoading, setRelatedLoading] = useState(false);
//   const [relatedError, setRelatedError] = useState<string | null>(null);

//   const navigate = useNavigate();
//   const location = useLocation();

//   // 최초 검색
//   useEffect(() => {
//     searchPlaces('한밭대학교');
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ====== 뒤로가기 복원 로직 ======
//   useEffect(() => {
//     const st: any = location.state;
//     const mapState = st?.mapState as (undefined | {
//       keyword?: string;
//       selectedIndex?: number | null;
//       isSidebarOpen?: boolean;
//       showRelatedPosts?: boolean;
//       selectedPlace?: any | null;
//       relatedPosts?: BoardListItem[];
//       relatedError?: string | null;
//     });

//     if (mapState) {
//       if (mapState.keyword) {
//         searchPlaces(mapState.keyword);
//       }
//       setSelectedIndex(mapState.selectedIndex ?? null);
//       setIsSidebarOpen(!!mapState.isSidebarOpen);
//       setShowRelatedPosts(!!mapState.showRelatedPosts);
//       setSelectedPlace(mapState.selectedPlace ?? null);
//       setRelatedPosts(Array.isArray(mapState.relatedPosts) ? mapState.relatedPosts : []);
//       setRelatedError(mapState.relatedError ?? null);

//       navigate(location.pathname + location.search, { replace: true, state: null });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
//   // =================================

//   // 검색
//   const handleSearch = (start: string) => {
//     if (start) searchPlaces(start);
//     setShowRelatedPosts(false);
//     setRelatedPosts([]);
//     setRelatedError(null);
//   };

//   // 연관 게시물 로드
//   const loadRelatedPosts = async (keyword: string) => {
//     setRelatedLoading(true);
//     setRelatedError(null);
//     try {
//       const res = await getSearchBoardListRequest(keyword.trim(), null);
//       const list = toBoardListItems(res);
//       setRelatedPosts(list);
//       setShowRelatedPosts(true);
//     } catch {
//       setRelatedError('연관 게시물을 불러오지 못했습니다.');
//       setRelatedPosts([]);
//       setShowRelatedPosts(true);
//     } finally {
//       setRelatedLoading(false);
//     }
//   };

//   // 선택 장소로 부드럽게 이동
//   const panToPlace = useCallback((place: any) => {
//     if (!place || !map) return;
//     const lat = parseFloat(place.y);
//     const lng = parseFloat(place.x);
//     if (Number.isNaN(lat) || Number.isNaN(lng)) return;

//     const pos = new kakao.maps.LatLng(lat, lng);
//     map.panTo(pos);      // 부드럽게 이동
//     map.setLevel(3);     // 적당히 확대
//   }, [map]);

//   // 마커/리스트 클릭
//   const handlePlaceClick = (place: any) => {
//     const idx = searchResults.indexOf(place);
//     setSelectedIndex(idx);
//     setSelectedPlace(place);
//     panToPlace(place);                  // ✅ 클릭 시 해당 위치로 자연스럽게 이동
//     if (place?.place_name) loadRelatedPosts(place.place_name);
//   };

//   // ===== 상세 이동 (히스토리 상태 보존) =====
//   const handleOpenPost = useCallback((boardNumber: string | number) => {
//     if (boardNumber === undefined || boardNumber === null) return;

//     // 현재 메인 화면 상태 저장 (현재 히스토리 항목에 덮어쓰기)
//     const mapState = {
//       keyword: selectedPlace?.place_name ?? '',
//       selectedIndex,
//       isSidebarOpen,
//       showRelatedPosts,
//       selectedPlace,
//       relatedPosts,
//       relatedError,
//     };
//     navigate(location.pathname + location.search, {
//       replace: true,
//       state: { mapState },
//     });

//     // 상세로 이동 (뒤로가기 시 복원됨)
//     navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`, {
//       replace: false,
//       state: { fromMap: true },
//     });
//   }, [
//     navigate,
//     location.pathname, location.search,
//     selectedPlace, selectedIndex,
//     isSidebarOpen, showRelatedPosts,
//     relatedPosts, relatedError,
//   ]);

//   // 모드 전환/리셋
//   const resetDistanceState = () => { setDistancePoints([]); setDistanceKm(null); };
//   const resetRouteState = () => { setRouteSelectPoints([]); setRoutePath([]); setRouteInfo(null); setRouteLoading(false); setRouteError(null); };

//   const toggleDistanceMode = () => {
//     setIsDistanceMode(prev => {
//       const n = !prev;
//       if (n) { setIsRouteMode(false); resetRouteState(); } else { resetDistanceState(); }
//       return n;
//     });
//   };
//   const toggleRouteMode = () => {
//     setIsRouteMode(prev => {
//       const n = !prev;
//       if (n) { setIsDistanceMode(false); resetDistanceState(); } else { resetRouteState(); }
//       return n;
//     });
//   };

//   // 지도 클릭
//   const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
//     const clickedLatLng = mouseEvent.latLng;

//     if (isDistanceMode) {
//       const newPts = [...distancePoints, clickedLatLng];
//       if (newPts.length === 1) {
//         setDistancePoints(newPts);
//         setDistanceKm(null);
//         return;
//       }
//       if (newPts.length === 2) {
//         const [p1, p2] = newPts;
//         const km = getDistanceFromLatLonInKm(p1.getLat(), p1.getLng(), p2.getLat(), p2.getLng());
//         setDistancePoints(newPts);
//         setDistanceKm(km);
//         return;
//       }
//       setDistancePoints([clickedLatLng]);
//       setDistanceKm(null);
//       return;
//     }

//     if (isRouteMode) {
//       const next = [...routeSelectPoints, clickedLatLng];
//       if (next.length === 1) {
//         setRouteSelectPoints(next);
//         setRouteError(null);
//         setRoutePath([]);
//         setRouteInfo(null);
//         return;
//       }
//       if (next.length === 2) {
//         setRouteSelectPoints(next);
//         setRouteLoading(true);
//         setRouteError(null);
//         setRoutePath([]);
//         setRouteInfo(null);

//         const [s, e] = next;
//         const start = { lat: s.getLat(), lng: s.getLng() };
//         const end = { lat: e.getLat(), lng: e.getLng() };

//         fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ start, end })
//         })
//           .then(async (r) => {
//             if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
//             return r.json();
//           })
//           .then((geojson) => {
//             const features = geojson?.features ?? [];
//             const lineFeatures = features.filter((f: any) => f?.geometry?.type === 'LineString');
//             const coords: LatLng[] = lineFeatures.flatMap((f: any) =>
//               (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
//             );
//             const summaryFeature = features.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime);
//             const summary = summaryFeature?.properties
//               ? { totalDistance: summaryFeature.properties.totalDistance, totalTime: summaryFeature.properties.totalTime }
//               : undefined;

//             setRoutePath(coords);
//             setRouteInfo(summary ?? null);
//           })
//           .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
//           .finally(() => setRouteLoading(false));
//         return;
//       }
//       setRouteSelectPoints([clickedLatLng]);
//       setRoutePath([]);
//       setRouteInfo(null);
//       setRouteError(null);
//       return;
//     }
//   };

//   const formatDistance = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`);
//   const formatMeters = (m?: number) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(2)} km`);
//   const formatMinutes = (sec?: number) => (sec == null ? '' : `${Math.round(sec / 60)} min`);
//   const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
//   const rightBase = showRelatedPosts ? 320 : 10;

//   const currentKeyword = useMemo(() => selectedPlace?.place_name ?? '', [selectedPlace]);

//   return (
//     <div className='main-wrapper'>
//       <SearchSidebar
//         searchResults={searchResults}
//         onClickItem={handlePlaceClick}
//         selectedIndex={selectedIndex}
//         isOpen={isSidebarOpen}
//         toggleOpen={toggleSidebar}
//         onSearch={handleSearch}
//       />

//       {selectedPlace && (
//         <RelatedPostsSidebar
//           placeName={currentKeyword}
//           relatedPosts={relatedPosts}
//           loading={relatedLoading}
//           error={relatedError}
//           open={showRelatedPosts}
//           onClose={() => setShowRelatedPosts(false)}
//           onClickPost={handleOpenPost}
//         />
//       )}

//       <button
//         className={`distance-toggle-button ${isDistanceMode ? 'active' : ''}`}
//         onClick={toggleDistanceMode}
//         style={{ top: 3, right: rightBase + 120 }}
//       >
//         {isDistanceMode ? '일직선 거리 종료' : '일직선 거리'}
//       </button>

//       <button
//         className={`distance-toggle-button ${isRouteMode ? 'active' : ''}`}
//         onClick={toggleRouteMode}
//         style={{ top: 3, right: rightBase }}
//       >
//         {isRouteMode ? '경로 보기 종료' : '두 지점 경로'}
//       </button>

//       {isDistanceMode && distanceKm !== null && (
//         <div className="distance-overlay">
//           선택된 두 지점 사이의 직선 거리는 약 {formatDistance(distanceKm)} 입니다.
//         </div>
//       )}
//       {isRouteMode && (routeLoading || routeError || routeInfo) && (
//         <div className="distance-overlay">
//           {routeLoading && '경로를 불러오는 중...'}
//           {!routeLoading && routeError && routeError}
//           {!routeLoading && !routeError && routeInfo && (
//             <>
//               보행자 경로&nbsp;
//               {routeInfo.totalDistance != null && <>거리: {formatMeters(routeInfo.totalDistance)}&nbsp;</>}
//               {routeInfo.totalTime != null && <>시간: {formatMinutes(routeInfo.totalTime)}</>}
//             </>
//           )}
//         </div>
//       )}

//       <Map
//         center={center}
//         style={{ width: '100%', height: '100vh' }}
//         level={4}
//         onCreate={(m) => setMap(m)}   // ✅ 맵 인스턴스 저장
//         onClick={handleMapClick}
//       >
//         <MapTypeControl position="TOPRIGHT" />
//         <ZoomControl position="RIGHT" />

//         {searchResults.map((place, index) => (
//           <MapMarker
//             key={`search-${index}`}
//             position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
//             onClick={() => handlePlaceClick(place)}
//             clickable={true}
//           >
//             {selectedIndex === index && (
//               <div className="marker-info">
//                 <strong>{place.place_name}</strong>
//               </div>
//             )}
//           </MapMarker>
//         ))}

//         {isDistanceMode && distancePoints.map((p, idx) => (
//           <MapMarker
//             key={`distpoint-${idx}`}
//             position={{ lat: p.getLat(), lng: p.getLng() }}
//             image={{
//               src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
//               size: { width: 64, height: 69 },
//               options: { offset: { x: 27, y: 69 } },
//             }}
//           />
//         ))}

//         {isDistanceMode && distancePoints.length === 2 && (
//           <Polyline
//             path={distancePoints.map(p => ({ lat: p.getLat(), lng: p.getLng() }))}
//             strokeWeight={5}
//             strokeColor={'#FF0000'}
//             strokeOpacity={0.8}
//             strokeStyle={'solid'}
//           />
//         )}

//         {isRouteMode && routeSelectPoints.map((p, idx) => (
//           <MapMarker
//             key={`routepick-${idx}`}
//             position={{ lat: p.getLat(), lng: p.getLng() }}
//             image={{
//               src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
//               size: { width: 24, height: 35 },
//               options: { offset: { x: 12, y: 35 } },
//             }}
//           />
//         ))}

//         {isRouteMode && routePath.length > 1 && (
//           <Polyline
//             path={routePath}
//             strokeWeight={5}
//             strokeColor={'#2E86DE'}
//             strokeOpacity={0.8}
//             strokeStyle={'solid'}
//           />
//         )}
//       </Map>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
import RelatedPostsSidebar from 'components/RelatedPostsSidebar';
import { BoardListItem } from 'types/interface';
import { getSearchBoardListRequest } from 'apis';
import { usePlacesAlongPath } from 'hooks/Map/usePlacesAlongPath';
import './style.css';
import 'components/Map/marker-label.css';
import ChatBotButton from 'components/ChatBot/ChatBotButton';

const BOARD_DETAIL_PATH = '/board/detail';
declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

function deg2rad(deg: number) { return deg * (Math.PI / 180); }
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
type LatLng = { lat: number; lng: number };

function toBoardListItems(res: any): BoardListItem[] {
  if (!res) return [];
  const payload = (res && typeof res === 'object' && 'code' in res && 'data' in res) ? (res as any).data : res;

  const list =
    (Array.isArray(payload?.boardList) && payload.boardList) ||
    (Array.isArray(payload?.searchList) && payload.searchList) ||
    (Array.isArray(payload?.list) && payload.list) ||
    (Array.isArray(payload?.result) && payload.result) ||
    (Array.isArray(payload?.rows) && payload.rows) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload) && payload) ||
    [];

  return (list as any[]).map((it: any) => ({
    boardNumber: it.boardNumber ?? it.id ?? it.board_id,
    title: it.title ?? '(제목 없음)',
    content: typeof it?.content === 'string'
      ? it.content
      : (typeof it?.text === 'string' ? it.text : ''),
  })) as BoardListItem[];
}

// ★ routePlaces 포커스용 키 생성: id가 없으면 lat,lng로 합성
const toNum = (v: any) => typeof v === 'string' ? Number(v) : v;
const makeRouteKey = (p: any) => (p?.id && `${p.id}`) || `${toNum(p?.lat)},${toNum(p?.lng)}`;

/* =========================
   거리 유틸 / 보간 / 구간 슬라이스
========================= */
function buildCumulativeDist(path: LatLng[]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // m
  const dist = (a: LatLng, b: LatLng) => {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = dLng * Math.cos((lat1 + lat2) / 2);
    const y = dLat;
    return Math.sqrt(x * x + y * y) * R;
  };
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + dist(path[i - 1], path[i]);
  return cum;
}
function interpolateAt(path: LatLng[], cum: number[], s: number): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (s <= 0) return path[0];
  const total = cum[cum.length - 1] || 0;
  if (s >= total) return path[path.length - 1];

  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cum[mid] < s) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const s0 = cum[i - 1], s1 = cum[i];
  const t = (s - s0) / (s1 - s0);
  const a = path[i - 1], b = path[i];
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
/** [a,b]m 구간만 잘라서 반환 (시작/끝 보간 포함) */
function slicePathRange(path: LatLng[], cum: number[], a: number, b: number): LatLng[] {
  const total = cum[cum.length - 1] || 0;
  if (total <= 0 || path.length < 2) return [];
  if (a < 0) a = 0;
  if (b > total) b = total;
  if (b <= a) return [];

  const start = interpolateAt(path, cum, a);
  const end = interpolateAt(path, cum, b);

  const seg: LatLng[] = [start];
  for (let i = 1; i < path.length; i++) {
    if (cum[i] > a && cum[i] < b) seg.push(path[i]);
  }
  seg.push(end);
  return seg;
}

/** 개미행렬(테두리) 세그먼트 생성 */
function makeAntSegments(path: LatLng[], cum: number[], phase: number, dashLen: number, gapLen: number, maxSeg = 200) {
  const total = cum[cum.length - 1] || 0;
  if (total <= 0 || path.length < 2) return [] as LatLng[][];
  const period = dashLen + gapLen;
  if (period <= 0) return [];

  // phase를 [0, period)로 정규화
  let startS = ((phase % period) + period) % period;

  const segs: LatLng[][] = [];
  // 루트 전체를 순회하며 [startS + k*period, startS + k*period + dashLen] 구간을 자름
  for (let s = startS; s < total && segs.length < maxSeg; s += period) {
    const a = s;
    const b = Math.min(s + dashLen, total);
    const seg = slicePathRange(path, cum, a, b);
    if (seg.length >= 2) segs.push(seg);
  }
  return segs;
}

export default function Main() {
  const { searchResults, center, searchPlaces } = useKakaoSearch();

  // ★ map 상태
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ===== 직선거리 =====
  const [isDistanceMode, setIsDistanceMode] = useState(false);
  const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // ===== 두 지점 경로(지도 클릭) =====
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // ===== 사이드바 경로 보기 =====
  const [autoRoutePath, setAutoRoutePath] = useState<LatLng[]>([]);
  const [autoRouteInfo, setAutoRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [autoRouteEndpoints, setAutoRouteEndpoints] = useState<{ start?: LatLng; end?: LatLng } | null>(null);
  const [autoRouteLoading, setAutoRouteLoading] = useState(false);
  const [autoRouteError, setAutoRouteError] = useState<string | null>(null);

  // ===== 경로 주변 맛집 =====
  const {
    places: routePlaces,
    loading: routePlacesLoading,
    error: routePlacesError,
    search: searchAlongPath,
    reset: resetRoutePlaces,
  } = usePlacesAlongPath();

  const [focusedRouteKey, setFocusedRouteKey] = useState<string | null>(null);

  // ===== 연관 게시물 =====
  const [showRelatedPosts, setShowRelatedPosts] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // 복원
  const RESTORE_KEY = 'map:restore';
  const restoreRef = useRef<{ keyword: string } | null>(null);

  const saveBeforeGoDetail = useCallback(() => {
    const keyword = selectedPlace?.place_name;
    if (keyword) sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ keyword }));
  }, [selectedPlace]);

  const tryRestoreOnMount = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(RESTORE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { keyword?: string };
      if (parsed?.keyword) {
        restoreRef.current = { keyword: parsed.keyword };
        searchPlaces(parsed.keyword);
        return true;
      }
      return false;
    } catch { return false; }
  }, [searchPlaces]);

  useEffect(() => {
    const restored = tryRestoreOnMount();
    if (!restored) searchPlaces('한밭대학교');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restoreRef.current) return;
    const { keyword } = restoreRef.current;
    if (!keyword) { restoreRef.current = null; return; }
    const found = searchResults.find((p: any) => p?.place_name === keyword);
    if (found) {
      handlePlaceClick(found);
      restoreRef.current = null;
      sessionStorage.removeItem(RESTORE_KEY);
    }
  }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색
  const handleSearch = (start: string, _goal?: string) => {
    if (start) searchPlaces(start);
    setShowRelatedPosts(false);
    setRelatedPosts([]);
    setRelatedError(null);
  };

  const loadRelatedPosts = async (keyword: string) => {
    setRelatedLoading(true);
    setRelatedError(null);
    try {
      const res = await getSearchBoardListRequest(keyword.trim(), null);
      setRelatedPosts(toBoardListItems(res));
      setShowRelatedPosts(true);
    } catch {
      setRelatedError('연관 게시물을 불러오지 못했습니다.');
      setRelatedPosts([]);
      setShowRelatedPosts(true);
    } finally {
      setRelatedLoading(false);
    }
  };

  // ★★★ 부드러운 이동 (줌 고정 이슈 수정)
  // - idle 리스너 사용 X
  // - 현재 레벨이 target보다 클 때만 setLevel(animate) → 사용자 줌 입력을 덮어쓰지 않음
  const panToPlace = useCallback((lat: number, lng: number, targetLevel: number | null = 3) => {
    if (!map) return;
    const pos = new kakao.maps.LatLng(lat, lng);

    if (targetLevel != null) {
      try {
        const cur = map.getLevel?.() ?? null;
        if (cur == null || cur > targetLevel) {
          (map as any).setLevel(targetLevel, { animate: true });
        }
      } catch {
        map.setLevel(targetLevel as number);
      }
    }
    map.panTo(pos); // 패닝은 항상 수행
  }, [map]);

  const handlePlaceClick = (place: any) => {
    const idx = searchResults.indexOf(place);
    setSelectedIndex(idx);
    setSelectedPlace(place);

    try {
      const lat = Number(place?.y);
      const lng = Number(place?.x);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) panToPlace(lat, lng, 3);
    } catch { /* ignore */ }

    if (place?.place_name) loadRelatedPosts(place.place_name);
  };

  const handleOpenPost = useCallback((boardNumber: string | number) => {
    if (boardNumber === undefined || boardNumber === null) return;
    saveBeforeGoDetail();
    navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`, {
      state: { from: location.pathname, fromMap: true, fromSearch: selectedPlace?.place_name ?? null },
    });
  }, [navigate, location.pathname, selectedPlace, saveBeforeGoDetail]);

  // 리셋
  const resetDistanceState = () => { setDistancePoints([]); setDistanceKm(null); };
  const resetRouteState = () => { setRouteSelectPoints([]); setRoutePath([]); setRouteInfo(null); setRouteLoading(false); setRouteError(null); };
  const resetAutoRoute = () => { setAutoRouteEndpoints(null); setAutoRoutePath([]); setAutoRouteInfo(null); setAutoRouteLoading(false); setAutoRouteError(null); resetRoutePlaces?.(); setFocusedRouteKey(null); };

  // 모드 토글
  const toggleDistanceMode = () => {
    setIsDistanceMode(prev => {
      const next = !prev;
      if (next) { setIsRouteMode(false); resetRouteState(); }
      else resetDistanceState();
      setFocusedRouteKey(null);
      return next;
    });
  };
  const toggleRouteMode = () => {
    setIsRouteMode(prev => {
      const next = !prev;
      if (next) { setIsDistanceMode(false); resetDistanceState(); }
      else resetRouteState();
      setFocusedRouteKey(null);
      return next;
    });
  };

  // Tmap 공용
  const callTmap = (start: LatLng, end: LatLng) =>
    fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end })
    }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
      return r.json();
    });

  // 두 지점 경로(지도 클릭)
  const runManualRoute = (sLL: kakao.maps.LatLng, eLL: kakao.maps.LatLng) => {
    setIsRouteMode(true);
    setIsDistanceMode(false);
    resetDistanceState();

    setRouteSelectPoints([sLL, eLL]);
    setRouteLoading(true);
    setRouteError(null);
    setRoutePath([]);
    setRouteInfo(null);

    callTmap({ lat: sLL.getLat(), lng: sLL.getLng() }, { lat: eLL.getLat(), lng: eLL.getLng() })
      .then((geojson) => {
        const features = geojson?.features ?? [];
        const lineFeatures = features.filter((f: any) => f?.geometry?.type === 'LineString');
        const coords: LatLng[] = lineFeatures.flatMap((f: any) =>
          (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
        );
        const summaryFeature = features.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime);
        const summary = summaryFeature?.properties
          ? { totalDistance: summaryFeature.properties.totalDistance, totalTime: summaryFeature.properties.totalTime }
          : undefined;

        setRoutePath(coords);
        setRouteInfo(summary ?? null);

        if (map && coords.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          coords.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
          map.setBounds(bounds);
        }
      })
      .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
      .finally(() => setRouteLoading(false));
  };

  // 사이드바 경로 + 주변 맛집
  const handleRouteByCoords = useCallback(
    async (start: { lat: number; lng: number; name: string }, end: { lat: number; lng: number; name: string }) => {
      setAutoRouteLoading(true);
      setAutoRouteError(null);
      setAutoRoutePath([]);
      setAutoRouteInfo(null);
      setAutoRouteEndpoints({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
      resetRoutePlaces?.();
      setFocusedRouteKey(null);

      try {
        const geojson = await callTmap({ lat: start.lat, lng: start.lng }, { lat: end.lat, lng: end.lng });
        const features = geojson?.features ?? [];
        const lineFeatures = features.filter((f: any) => f?.geometry?.type === 'LineString');
        const coords: LatLng[] = lineFeatures.flatMap((f: any) =>
          (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
        );
        const summaryFeature = features.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime);
        const summary = summaryFeature?.properties
          ? { totalDistance: summaryFeature.properties.totalDistance, totalTime: summaryFeature.properties.totalTime }
          : undefined;

        setAutoRoutePath(coords);
        setAutoRouteInfo(summary ?? null);

        if (coords.length > 0) await searchAlongPath(coords);

        if (map && coords.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          coords.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
          map.setBounds(bounds);
        }
      } catch {
        setAutoRouteError('경로를 불러오지 못했습니다.');
      } finally {
        setAutoRouteLoading(false);
      }
    },
    [searchAlongPath, resetRoutePlaces, map]
  );

  const focusRoutePlaceOnMap = useCallback((p: { id?: string; name?: string; lat: number|string; lng: number|string }) => {
    if (!p) return;
    const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
    const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = makeRouteKey({ ...p, lat, lng });
    setFocusedRouteKey(key);
    panToPlace(lat, lng, 3);
  }, [panToPlace]);

  const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    const clickedLatLng = mouseEvent.latLng;
    setFocusedRouteKey(null);

    if (isDistanceMode) {
      const newPts = [...distancePoints, clickedLatLng];
      if (newPts.length === 1) { setDistancePoints(newPts); setDistanceKm(null); return; }
      if (newPts.length === 2) {
        const [p1, p2] = newPts;
        const km = getDistanceFromLatLonInKm(p1.getLat(), p1.getLng(), p2.getLat(), p2.getLng());
        setDistancePoints(newPts); setDistanceKm(km); return;
      }
      setDistancePoints([clickedLatLng]); setDistanceKm(null); return;
    }

    if (isRouteMode) {
      const next = [...routeSelectPoints, clickedLatLng];
      if (next.length === 1) {
        setRouteSelectPoints(next);
        setRouteError(null); setRoutePath([]); setRouteInfo(null);
        return;
      }
      if (next.length === 2) {
        const [s, e] = next;
        runManualRoute(
          new kakao.maps.LatLng(s.getLat(), s.getLng()),
          new kakao.maps.LatLng(e.getLat(), e.getLng())
        );
        return;
      }
      setRouteSelectPoints([clickedLatLng]);
      setRoutePath([]); setRouteInfo(null); setRouteError(null);
      return;
    }
  };

  const formatDistance = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`);
  const formatMeters = (m?: number) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(2)} km`);
  const formatMinutes = (sec?: number) => (sec == null ? '' : `${Math.round(sec / 60)} min`);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const rightBase = showRelatedPosts ? 320 : 10;
  const currentKeyword = useMemo(() => selectedPlace?.place_name ?? '', [selectedPlace]);

  /* =========================
     테두리(개미행렬) 애니메이션
     - 고정선 위에 경계만 흐르게 표시
  ========================= */
  // 파라미터: 대시/간격/속도 개미행렬설정
  const DASH_LEN = 120;          // m
  const GAP_LEN = 170;            // m
  const BORDER_SPEED_ROUTE = 140; // m/s (파랑, 1회 재생)
  const BORDER_SPEED_AUTO  = 250; // m/s (초록, 루프)

  // 누적거리
  const routeCum = useMemo(() => (routePath.length > 1 ? buildCumulativeDist(routePath) : [0]), [routePath]);
  const autoCum  = useMemo(() => (autoRoutePath.length > 1 ? buildCumulativeDist(autoRoutePath) : [0]), [autoRoutePath]);
  const routeTotal = routeCum[routeCum.length - 1] || 0;
  const autoTotal  = autoCum[autoCum.length - 1]  || 0;

  // 개미행렬 phase (거리 단위)
  const [routePhase, setRoutePhase] = useState(0);
  const [autoPhase, setAutoPhase] = useState(0);
  const routeRaf = useRef<number | null>(null);
  const autoRaf  = useRef<number | null>(null);
  const routeLastTs = useRef<number | null>(null);
  const autoLastTs  = useRef<number | null>(null);

  // ★ 맵 조작 중(드래그/줌) 애니메이션 일시정지 플래그
  const pauseAntAnimRef = useRef(false);
  useEffect(() => {
    if (!map || !kakao?.maps?.event) return;
    const { event } = kakao.maps;

    const handleDragStart = () => { pauseAntAnimRef.current = true; };
    const handleDragEnd   = () => { pauseAntAnimRef.current = false; };
    const handleZoomStart = () => { pauseAntAnimRef.current = true; };
    const handleZoomChanged = () => { pauseAntAnimRef.current = false; };
    const handleIdle      = () => { pauseAntAnimRef.current = false; };

    event.addListener(map, 'dragstart', handleDragStart);
    event.addListener(map, 'dragend', handleDragEnd);
    event.addListener(map, 'zoom_start', handleZoomStart);
    event.addListener(map, 'zoom_changed', handleZoomChanged);
    event.addListener(map, 'idle', handleIdle);

    return () => {
      if (!kakao?.maps?.event || !map) return;
      event.removeListener(map, 'dragstart', handleDragStart);
      event.removeListener(map, 'dragend', handleDragEnd);
      event.removeListener(map, 'zoom_start', handleZoomStart);
      event.removeListener(map, 'zoom_changed', handleZoomChanged);
      event.removeListener(map, 'idle', handleIdle);
    };
  }, [map]);

  // 파랑: 경로 획득 후 한 바퀴 흘러가면 정지
  useEffect(() => {
    if (routeRaf.current) cancelAnimationFrame(routeRaf.current);
    routeRaf.current = null; routeLastTs.current = null;
    setRoutePhase(0);
    if (routePath.length < 2 || routeTotal <= 0) return;

    const period = DASH_LEN + GAP_LEN;
    const fullCycle = routeTotal + period; // 경계가 루트를 한 번 지나가도록 여유

    const tick = (ts: number) => {
      if (routeLastTs.current == null) routeLastTs.current = ts;
      const dt = (ts - (routeLastTs.current ?? ts)) / 1000;
      routeLastTs.current = ts;

      if (!pauseAntAnimRef.current) {
        setRoutePhase(prev => {
          const next = prev + BORDER_SPEED_ROUTE * dt;
          return next >= fullCycle ? fullCycle : next;
        });
      }

      routeRaf.current = requestAnimationFrame(tick);
    };
    routeRaf.current = requestAnimationFrame(tick);

    return () => {
      if (routeRaf.current) cancelAnimationFrame(routeRaf.current);
      routeRaf.current = null; routeLastTs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePath, routeTotal]);

  // 초록: 계속 루프
  useEffect(() => {
    if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
    autoRaf.current = null; autoLastTs.current = null;
    setAutoPhase(0);
    if (autoRoutePath.length < 2 || autoTotal <= 0) return;

    const period = DASH_LEN + GAP_LEN;

    const tick = (ts: number) => {
      if (autoLastTs.current == null) autoLastTs.current = ts;
      const dt = (ts - (autoLastTs.current ?? ts)) / 1000;
      autoLastTs.current = ts;

      if (!pauseAntAnimRef.current) {
        setAutoPhase(prev => (prev + BORDER_SPEED_AUTO * dt) % period);
      }

      autoRaf.current = requestAnimationFrame(tick);
    };
    autoRaf.current = requestAnimationFrame(tick);

    return () => {
      if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
      autoRaf.current = null; autoLastTs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRoutePath, autoTotal]);

  // 테두리(대시) 세그먼트
  const routeBorderSegs = useMemo(
    () => makeAntSegments(routePath, routeCum, routePhase, DASH_LEN, GAP_LEN, 180),
    [routePath, routeCum, routePhase]
  );
  const autoBorderSegs  = useMemo(
    () => makeAntSegments(autoRoutePath, autoCum, autoPhase, DASH_LEN, GAP_LEN, 180),
    [autoRoutePath, autoCum, autoPhase]
  );

  return (
    <div className='main-wrapper'>
      <SearchSidebar
        searchResults={searchResults}
        onClickItem={handlePlaceClick}
        selectedIndex={selectedIndex}
        isOpen={isSidebarOpen}
        toggleOpen={toggleSidebar}
        onSearch={handleSearch}
        onRouteByCoords={handleRouteByCoords}
        // 경로 주변 맛집 리스트 전달
        routePlaces={routePlaces}
        routeLoading={routePlacesLoading}
        routeError={routePlacesError ?? null}
        onFocusRoutePlace={focusRoutePlaceOnMap}
      />

      {selectedPlace && (
        <RelatedPostsSidebar
          placeName={currentKeyword}
          relatedPosts={relatedPosts}
          loading={relatedLoading}
          error={relatedError}
          open={showRelatedPosts}
          onClose={() => setShowRelatedPosts(false)}
          onClickPost={handleOpenPost}
        />
      )}

      {/* 오른쪽 상단 토글 */}
      <button
        className={`distance-toggle-button ${isDistanceMode ? 'active' : ''}`}
        onClick={toggleDistanceMode}
        style={{ top: 3, right: rightBase + 120 }}
      >
        {isDistanceMode ? '일직선 거리 종료' : '일직선 거리'}
      </button>
      <button
        className={`distance-toggle-button ${isRouteMode ? 'active' : ''}`}
        onClick={toggleRouteMode}
        style={{ top: 3, right: rightBase }}
      >
        {isRouteMode ? '경로 보기 종료' : '두 지점 경로'}
      </button>

      {/* 오버레이: 두 지점 경로 / 직선 */}
      {isDistanceMode && distanceKm !== null && (
        <div className="distance-overlay">선택된 두 지점 사이의 직선 거리는 약 {formatDistance(distanceKm)} 입니다.</div>
      )}
      {isRouteMode && (routeLoading || routeError || routeInfo) && (
        <div className="distance-overlay">
          {routeLoading && '경로를 불러오는 중...'}
          {!routeLoading && routeError && routeError}
          {!routeLoading && !routeError && routeInfo && (
            <>
              보행자 경로&nbsp;
              {routeInfo.totalDistance != null && <>거리: {formatMeters(routeInfo.totalDistance)}&nbsp;</>}
              {routeInfo.totalTime != null && <>시간: {formatMinutes(routeInfo.totalTime)}</>}
            </>
          )}
        </div>
      )}

      {/* 사이드바 경로 상태 배지 */}
      {autoRoutePath.length > 0 && (
        <div className="distance-overlay" style={{ top: 60 }}>
          사이드바 경로 표시 중&nbsp;
          {autoRouteInfo?.totalDistance != null && <>거리: {formatMeters(autoRouteInfo.totalDistance)}&nbsp;</>}
          {autoRouteInfo?.totalTime != null && <>시간: {formatMinutes(autoRouteInfo.totalTime)}</>}
          &nbsp;|&nbsp;
          <button onClick={resetAutoRoute} style={{ textDecoration: 'underline' }}>경로 지우기</button>
        </div>
      )}
      {autoRouteLoading && <div className="distance-overlay" style={{ top: 60 }}>경로 계산 중…</div>}
      {autoRouteError && <div className="distance-overlay" style={{ top: 60 }}>{autoRouteError}</div>}

      <Map
        center={center}
        style={{ width: '100%', height: '100vh' }}
        level={4}
        onClick={handleMapClick}
        onCreate={(m) => {
          setMap(m);
          try { (m as any).setZoomable?.(true); } catch { /* ignore */ }
        }}
        className="map"
      >
        <MapTypeControl position="TOPRIGHT" />
        <ZoomControl position="RIGHT" />

        {/* 일반 검색 결과 마커 */}
        {searchResults.map((place, index) => (
          <MapMarker
            key={`search-${index}`}
            position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
            onClick={() => handlePlaceClick(place)}
            clickable={true}
          >
            {selectedIndex === index && (
              <div className="marker-info"><strong>{place.place_name}</strong></div>
            )}
          </MapMarker>
        ))}

        {/* 직선 거리 */}
        {isDistanceMode && distancePoints.map((p, idx) => (
          <MapMarker
            key={`distpoint-${idx}`}
            position={{ lat: p.getLat(), lng: p.getLng() }}
            image={{
              src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
              size: { width: 64, height: 69 },
              options: { offset: { x: 27, y: 69 } },
            }}
          />
        ))}
        {isDistanceMode && distancePoints.length === 2 && (
          <Polyline
            path={distancePoints.map(p => ({ lat: p.getLat(), lng: p.getLng() }))}
            strokeWeight={5}
            strokeColor={'#FF0000'}
            strokeOpacity={0.8}
            strokeStyle={'solid'}
          />
        )}

        {/* 두 지점 경로(지도 클릭) — 기본 고정선(파랑) */}
        {isRouteMode && routeSelectPoints.map((p, idx) => (
          <MapMarker
            key={`routepick-${idx}`}
            position={{ lat: p.getLat(), lng: p.getLng() }}
            image={{
              src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
              size: { width: 24, height: 35 },
              options: { offset: { x: 12, y: 35 } },
            }}
          />
        ))}
        {isRouteMode && routePath.length > 1 && (
          <Polyline
            path={routePath}
            strokeWeight={5}
            strokeColor={'#8a2ea1ff'}
            strokeOpacity={0.9}
            strokeStyle={'solid'}
            zIndex={5}
          />
        )}
        {/* 파랑 경계(개미행렬) */}
        {isRouteMode && routeBorderSegs.map((seg, i) => (
          <Polyline
            key={`rborder-${i}`}
            path={seg}
            strokeWeight={7}
            strokeColor={'#FFFFFF'}
            strokeOpacity={0.9}
            strokeStyle={'solid'}
            zIndex={6}
          />
        ))}

        {/* 사이드바 경로 — 기본 고정선(초록) */}
        {autoRouteEndpoints?.start && <MapMarker key="auto-start" position={{ lat: autoRouteEndpoints.start.lat, lng: autoRouteEndpoints.start.lng }} />}
        {autoRouteEndpoints?.end &&   <MapMarker key="auto-end"   position={{ lat: autoRouteEndpoints.end.lat,   lng: autoRouteEndpoints.end.lng }} />}
        {autoRoutePath.length > 1 && (
          <Polyline
            path={autoRoutePath}
            strokeWeight={6}
            strokeColor={'#8a2ea1ff'}
            strokeOpacity={0.95}
            strokeStyle={'solid'}
            zIndex={5}
          />
        )}
        {/* 초록 경계(개미행렬, 루프) */}
        {autoBorderSegs.map((seg, i) => (
          <Polyline
            key={`aborder-${i}`}
            path={seg}
            strokeWeight={8}
            strokeColor={'#FFFFFF'}
            strokeOpacity={0.9}
            strokeStyle={'solid'}
            zIndex={6}
          />
        ))}

        {/* 경로 주변 맛집 */}
        {routePlaces && routePlaces.map((p, idx) => {
          const lat = typeof (p as any).lat === 'string' ? parseFloat((p as any).lat) : (p as any).lat;
          const lng = typeof (p as any).lng === 'string' ? parseFloat((p as any).lng) : (p as any).lng;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const key = makeRouteKey({ ...p, lat, lng });
          const isFocused = focusedRouteKey === key;

          return (
            <React.Fragment key={`routeplace-${key}-${idx}`}>
              <MapMarker
                position={{ lat, lng }}
                onClick={() => { setFocusedRouteKey(key); panToPlace(lat, lng, 3); }}
                clickable
              />
              {isFocused && (
                <CustomOverlayMap position={{ lat, lng }} yAnchor={1.25} zIndex={9}>
                  <div className="km-label">{(p as any).name}</div>
                </CustomOverlayMap>
              )}
            </React.Fragment>
          );
        })}
      </Map>

      <div><ChatBotButton/></div>
    </div>
  );
}

