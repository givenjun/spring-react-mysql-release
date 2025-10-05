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

// import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl, CustomOverlayMap } from 'react-kakao-maps-sdk';
// import { useNavigate, useLocation } from 'react-router-dom';
// import SearchSidebar from 'components/Map/SearchSidebar';
// import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
// import RelatedPostsSidebar from 'components/RelatedPostsSidebar';
// import { BoardListItem } from 'types/interface';
// import { getSearchBoardListRequest } from 'apis';
// import { usePlacesAlongPath } from 'hooks/Map/usePlacesAlongPath';
// import PlaceList from 'components/Map/PlaceList';
// import './style.css';
// import 'components/Map/marker-label.css';
// import ChatBotButton from 'components/ChatBot/ChatBotButton';

// const BOARD_DETAIL_PATH = '/board/detail';
// declare global { interface Window { kakao: any } }
// const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

// /* =========================
//    공통 유틸
// ========================= */
// type LatLng = { lat: number; lng: number };

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
// const toNum = (v: any) => typeof v === 'string' ? Number(v) : v;
// const makeRouteKey = (p: any) => (p?.id && `${p.id}`) || `${toNum(p?.lat)},${toNum(p?.lng)}`;

// /* =========================
//    경로 기하 유틸(누적거리/보간/세그먼트)
// ========================= */
// const toRad = (d: number) => (d * Math.PI) / 180;
// const toDeg = (r: number) => (r * 180) / Math.PI;

// function haversine(a: LatLng, b: LatLng) {
//   const R = 6371000;
//   const dLat = toRad(b.lat - a.lat);
//   const dLng = toRad(b.lng - a.lng);
//   const lat1 = toRad(a.lat);
//   const lat2 = toRad(b.lat);
//   const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//   return 2 * R * Math.asin(Math.sqrt(h)); // meters
// }
// function bearing(a: LatLng, b: LatLng) {
//   const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
//   const x =
//     Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
//     Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
//   return Math.atan2(y, x); // radians
// }
// function buildCumulativeDist(path: LatLng[]) {
//   const cum: number[] = [0];
//   for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversine(path[i - 1], path[i]);
//   return cum;
// }
// function interpolateAt(path: LatLng[], cum: number[], s: number): LatLng {
//   if (path.length === 0) return { lat: 0, lng: 0 };
//   if (s <= 0) return path[0];
//   const total = cum[cum.length - 1] || 0;
//   if (s >= total) return path[path.length - 1];

//   let lo = 0, hi = cum.length - 1;
//   while (lo < hi) {
//     const mid = Math.floor((lo + hi) / 2);
//     if (cum[mid] < s) lo = mid + 1;
//     else hi = mid;
//   }
//   const i = Math.max(1, lo);
//   const s0 = cum[i - 1], s1 = cum[i];
//   const t = (s - s0) / (s1 - s0);
//   const a = path[i - 1], b = path[i];
//   return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
// }
// function slicePathRange(path: LatLng[], cum: number[], a: number, b: number): LatLng[] {
//   const total = cum[cum.length - 1] || 0;
//   if (total <= 0 || path.length < 2) return [];
//   if (a < 0) a = 0;
//   if (b > total) b = total;
//   if (b <= a) return [];
//   const start = interpolateAt(path, cum, a);
//   const end = interpolateAt(path, cum, b);
//   const seg: LatLng[] = [start];
//   for (let i = 1; i < path.length; i++) if (cum[i] > a && cum[i] < b) seg.push(path[i]);
//   seg.push(end);
//   return seg;
// }
// function offsetByMeters(p: LatLng, azimuthRad: number, d: number, leftOrRight: 'left' | 'right'): LatLng {
//   const mPerDegLat = 110540;
//   const mPerDegLng = 111320 * Math.cos(toRad(p.lat));
//   const theta = azimuthRad + (leftOrRight === 'left' ? -Math.PI / 2 : Math.PI / 2);
//   const dx = (d * Math.cos(theta)) / mPerDegLng;
//   const dy = (d * Math.sin(theta)) / mPerDegLat;
//   return { lat: p.lat + dy, lng: p.lng + dx };
// }
// function makeOffsetVias(basePath: LatLng[], d = 60): { left?: LatLng; right?: LatLng } {
//   if (!basePath || basePath.length < 2) return {};
//   let total = 0;
//   const segLen: number[] = [];
//   for (let i = 1; i < basePath.length; i++) {
//     const L = haversine(basePath[i - 1], basePath[i]);
//     segLen.push(L);
//     total += L;
//   }
//   if (total === 0) return {};
//   const target = total / 2;

//   let acc = 0;
//   let idx = 0;
//   for (; idx < segLen.length; idx++) {
//     if (acc + segLen[idx] >= target) break;
//     acc += segLen[idx];
//   }
//   const i = Math.min(Math.max(0, idx), basePath.length - 2);
//   const a = basePath[i];
//   const b = basePath[i + 1];

//   const az = bearing(a, b);
//   const mid: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
//   return {
//     left: offsetByMeters(mid, az, d, 'left'),
//     right: offsetByMeters(mid, az, d, 'right'),
//   };
// }
// function complexityScore(path: LatLng[]): number {
//   if (!path || path.length < 3) return 0;
//   let turnSum = 0, zigzag = 0, shortSeg = 0, totalLen = 0, prevSign = 0;
//   for (let i = 1; i < path.length; i++) {
//     const seg = haversine(path[i - 1], path[i]);
//     totalLen += seg;
//     if (seg <= 20) shortSeg++;
//     if (i < path.length - 1) {
//       const a = bearing(path[i - 1], path[i]);
//       const b = bearing(path[i], path[i + 1]);
//       let d = b - a;
//       while (d > Math.PI) d -= 2 * Math.PI;
//       while (d < -Math.PI) d += 2 * Math.PI;
//       const deg = Math.abs(toDeg(d));
//       if (deg > 30) {
//         const sev = (deg / 90) ** 1.3;
//         turnSum += sev;
//         const sign = d > 0 ? 1 : -1;
//         if (prevSign && sign !== prevSign) zigzag++;
//         prevSign = sign;
//       }
//     }
//   }
//   if (totalLen === 0) return 0;
//   const perKm = totalLen / 1000;
//   const shortRate = shortSeg / Math.max(1, path.length - 1);
//   const zigzagRate = zigzag / Math.max(1, path.length - 2);
//   const alpha = 0.5, beta = 0.3;
//   return turnSum / perKm + alpha * shortRate + beta * zigzagRate;
// }

// /* =========================
//    Main 컴포넌트
// ========================= */
// export default function Main() {
//   const { searchResults, center, searchPlaces } = useKakaoSearch();

//   // map 상태
//   const [map, setMap] = useState<kakao.maps.Map | null>(null);

//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

//   // 직선거리
//   const [isDistanceMode, setIsDistanceMode] = useState(false);
//   const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
//   const [distanceKm, setDistanceKm] = useState<number | null>(null);

//   // 두 지점 경로(지도 클릭)
//   const [isRouteMode, setIsRouteMode] = useState(false);
//   const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
//   const [routePath, setRoutePath] = useState<LatLng[]>([]);
//   const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
//   const [routeLoading, setRouteLoading] = useState(false);
//   const [routeError, setRouteError] = useState<string | null>(null);

//   // 사이드바 경로(선택 경로를 맵에 강조 표시)
//   const [autoRoutePath, setAutoRoutePath] = useState<LatLng[]>([]);
//   const [autoRouteInfo, setAutoRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
//   const [autoRouteEndpoints, setAutoRouteEndpoints] = useState<{ start?: LatLng; end?: LatLng } | null>(null);
//   const [autoRouteLoading, setAutoRouteLoading] = useState(false);
//   const [autoRouteError, setAutoRouteError] = useState<string | null>(null);

//   // 3경로 옵션
//   type RouteOption = {
//     id: string;
//     name: '빠른길' | '권장길' | '쉬운길';
//     path: LatLng[];
//     timeSec: number;
//     distanceM: number;
//     complexity: number;
//   };
//   const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
//   const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

//   // 경로 주변 맛집
//   const {
//     places: routePlaces,
//     loading: routePlacesLoading,
//     error: routePlacesError,
//     search: searchAlongPath,
//     reset: resetRoutePlaces,
//   } = usePlacesAlongPath();
//   const [focusedRouteKey, setFocusedRouteKey] = useState<string | null>(null);

//   // 연관 게시물
//   const [showRelatedPosts, setShowRelatedPosts] = useState(false);
//   const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
//   const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
//   const [relatedLoading, setRelatedLoading] = useState(false);
//   const [relatedError, setRelatedError] = useState<string | null>(null);

//   const navigate = useNavigate();
//   const location = useLocation();

//   // 뒤로가기 복원
//   const RESTORE_KEY = 'map:restore';
//   const restoreRef = useRef<{ keyword: string } | null>(null);
//   const saveBeforeGoDetail = useCallback(() => {
//     const keyword = selectedPlace?.place_name;
//     if (keyword) sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ keyword }));
//   }, [selectedPlace]);
//   const tryRestoreOnMount = useCallback(() => {
//     try {
//       const raw = sessionStorage.getItem(RESTORE_KEY);
//       if (!raw) return false;
//       const parsed = JSON.parse(raw) as { keyword?: string };
//       if (parsed?.keyword) {
//         restoreRef.current = { keyword: parsed.keyword };
//         searchPlaces(parsed.keyword);
//         return true;
//       }
//       return false;
//     } catch { return false; }
//   }, [searchPlaces]);

//   useEffect(() => {
//     const restored = tryRestoreOnMount();
//     if (!restored) searchPlaces('한밭대학교');
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
//   useEffect(() => {
//     if (!restoreRef.current) return;
//     const { keyword } = restoreRef.current;
//     if (!keyword) { restoreRef.current = null; return; }
//     const found = searchResults.find((p: any) => p?.place_name === keyword);
//     if (found) {
//       handlePlaceClick(found);
//       restoreRef.current = null;
//       sessionStorage.removeItem(RESTORE_KEY);
//     }
//   }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

//   // 검색
//   const handleSearch = (start: string) => {
//     if (start) searchPlaces(start);
//     setShowRelatedPosts(false);
//     setRelatedPosts([]);
//     setRelatedError(null);
//   };
//   const loadRelatedPosts = async (keyword: string) => {
//     setRelatedLoading(true);
//     setRelatedError(null);
//     try {
//       const res = await getSearchBoardListRequest(keyword.trim(), null);
//       setRelatedPosts(toBoardListItems(res));
//       setShowRelatedPosts(true);
//     } catch {
//       setRelatedError('연관 게시물을 불러오지 못했습니다.');
//       setRelatedPosts([]);
//       setShowRelatedPosts(true);
//     } finally {
//       setRelatedLoading(false);
//     }
//   };

//   // 부드러운 이동
//   const panToPlace = useCallback((lat: number, lng: number, targetLevel: number | null = 3) => {
//     if (!map) return;
//     const pos = new kakao.maps.LatLng(lat, lng);
//     if (targetLevel != null) {
//       try {
//         const cur = map.getLevel?.() ?? null;
//         if (cur == null || cur > targetLevel) (map as any).setLevel(targetLevel, { animate: true });
//       } catch { map.setLevel(targetLevel as number); }
//     }
//     map.panTo(pos);
//   }, [map]);

//   const handlePlaceClick = (place: any) => {
//     const idx = searchResults.indexOf(place);
//     setSelectedIndex(idx);
//     setSelectedPlace(place);
//     try {
//       const lat = Number(place?.y);
//       const lng = Number(place?.x);
//       if (!Number.isNaN(lat) && !Number.isNaN(lng)) panToPlace(lat, lng, 3);
//     } catch { /* ignore */ }
//     if (place?.place_name) loadRelatedPosts(place.place_name);
//   };
//   const handleOpenPost = useCallback((boardNumber: string | number) => {
//     if (boardNumber === undefined || boardNumber === null) return;
//     saveBeforeGoDetail();
//     navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`, {
//       state: { from: location.pathname, fromMap: true, fromSearch: selectedPlace?.place_name ?? null },
//     });
//   }, [navigate, location.pathname, selectedPlace, saveBeforeGoDetail]);

//   // 리셋
//   const resetDistanceState = () => { setDistancePoints([]); setDistanceKm(null); };
//   const resetRouteState = () => { setRouteSelectPoints([]); setRoutePath([]); setRouteInfo(null); setRouteLoading(false); setRouteError(null); };
//   const resetAutoRoute = () => {
//     setAutoRouteEndpoints(null);
//     setAutoRoutePath([]);
//     setAutoRouteInfo(null);
//     setAutoRouteLoading(false);
//     setAutoRouteError(null);
//     resetRoutePlaces?.();
//     setFocusedRouteKey(null);
//     setRouteOptions([]);
//   };

//   // 모드 토글
//   const toggleDistanceMode = () => {
//     setIsDistanceMode(prev => {
//       const next = !prev;
//       if (next) { setIsRouteMode(false); resetRouteState(); }
//       else resetDistanceState();
//       setFocusedRouteKey(null);
//       return next;
//     });
//   };
//   const toggleRouteMode = () => {
//     setIsRouteMode(prev => {
//       const next = !prev;
//       if (next) { setIsDistanceMode(false); resetDistanceState(); }
//       else resetRouteState();
//       setFocusedRouteKey(null);
//       return next;
//     });
//   };

//   // Tmap 호출
//   const callTmap = (body: { start: LatLng; end: LatLng; viaPoints?: LatLng[] }) =>
//     fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body)
//     }).then(async (r) => {
//       if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
//       return r.json();
//     });

//   // 두 지점 경로(지도 클릭)
//   const runManualRoute = (sLL: kakao.maps.LatLng, eLL: kakao.maps.LatLng) => {
//     setIsRouteMode(true);
//     setIsDistanceMode(false);
//     resetDistanceState();

//     setRouteSelectPoints([sLL, eLL]);
//     setRouteLoading(true);
//     setRouteError(null);
//     setRoutePath([]);
//     setRouteInfo(null);

//     callTmap({ start: { lat: sLL.getLat(), lng: sLL.getLng() }, end: { lat: eLL.getLat(), lng: eLL.getLng() } })
//       .then((geojson) => {
//         const features = geojson?.features ?? [];
//         const lineFeatures = features.filter((f: any) => f?.geometry?.type === 'LineString');
//         const coords: LatLng[] = lineFeatures.flatMap((f: any) =>
//           (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
//         );
//         const summaryFeature = features.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime);
//         const summary = summaryFeature?.properties
//           ? { totalDistance: summaryFeature.properties.totalDistance, totalTime: summaryFeature.properties.totalTime }
//           : undefined;

//         setRoutePath(coords);
//         setRouteInfo(summary ?? null);

//         if (map && coords.length > 0) {
//           const bounds = new kakao.maps.LatLngBounds();
//           coords.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
//           map.setBounds(bounds);
//         }
//       })
//       .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
//       .finally(() => setRouteLoading(false));
//   };

//   /* =========================
//      사이드바 경로: 보행자 3경로 생성 (V1)
//   ========================= */
//   const [detailOpen, setDetailOpen] = useState(false);

//   const handleRouteByCoords = useCallback(
//     async (start: { lat: number; lng: number; name: string }, end: { lat: number; lng: number; name: string }) => {
//       setAutoRouteLoading(true);
//       setAutoRouteError(null);
//       setAutoRoutePath([]);
//       setAutoRouteInfo(null);
//       setAutoRouteEndpoints({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
//       resetRoutePlaces?.();
//       setFocusedRouteKey(null);
//       setDetailOpen(false);
//       setRouteOptions([]);

//       try {
//         // 1) 기본 경로
//         const geo0 = await callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
//         const feat0 = geo0?.features ?? [];
//         const line0 = feat0.filter((f: any) => f?.geometry?.type === 'LineString');
//         const path0: LatLng[] = line0.flatMap((f: any) =>
//           (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
//         );
//         const sum0 = feat0.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime)?.properties ?? {};
//         const time0 = Number(sum0.totalTime ?? sum0.time ?? 0);
//         const dist0 = Number(sum0.totalDistance ?? sum0.distance ?? 0);

//         if (path0.length < 2) throw new Error('경로가 비어 있습니다.');

//         // 2) via 오프셋 생성
//         const vias = makeOffsetVias(path0, 60);
//         const promises: Array<Promise<any>> = [Promise.resolve(geo0)];
//         if (vias.left)  promises.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng }, viaPoints: [vias.left] }));
//         if (vias.right) promises.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end:   { lat: end.lat,   lng: end.lng   }, viaPoints: [vias.right] } as any)); // TS 회피용

//         const geos = await Promise.all(promises);

//         // 3) 후보 경로 파싱/점수화
//         const candidates: RouteOption[] = geos.map((geo: any, idx: number): RouteOption => {
//           const fs = geo?.features ?? [];
//           const ls = fs.filter((f: any) => f?.geometry?.type === 'LineString');
//           const path: LatLng[] = ls.flatMap((f: any) =>
//             (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
//           );
//           const s = fs.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime)?.properties ?? {};
//           const t = Number(s.totalTime ?? s.time ?? 0);
//           const d = Number(s.totalDistance ?? s.distance ?? 0);

//           return {
//             id: `cand-${idx}`,
//             name: '권장길',
//             path,
//             timeSec: Math.round(t),
//             distanceM: Math.round(d),
//             complexity: complexityScore(path),
//           };
//         }).filter(c => c.path.length > 1);

//         if (candidates.length === 0) throw new Error('대안 경로 생성에 실패했습니다.');

//         // 4) 라벨링 (유일하게 빠른/쉬운/권장 1개씩)
//         const times = candidates.map(s => s.timeSec);
//         const comps = candidates.map(s => s.complexity);
//         const tMin = Math.min(...times), tMax = Math.max(...times);
//         const cMin = Math.min(...comps), cMax = Math.max(...comps);
//         const norm = (v: number, lo: number, hi: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));

//         const pickMinIdx = (arr: number[], exclude = new Set<number>()) => {
//           let best = -1, bestVal = Infinity;
//           arr.forEach((v, i) => { if (!exclude.has(i) && v < bestVal) { best = i; bestVal = v; } });
//           return best;
//         };

//         const idxFast = pickMinIdx(times);
//         const excluded = new Set<number>([idxFast]);
//         let idxEasy = pickMinIdx(comps, excluded);
//         if (idxEasy === -1) idxEasy = idxFast;
//         excluded.add(idxEasy);

//         const balScore = candidates.map(s => 0.8 * norm(s.timeSec, tMin, tMax) + 0.2 * norm(s.complexity, cMin, cMax));
//         let idxBal = pickMinIdx(balScore, excluded);
//         if (idxBal === -1) idxBal = [0,1,2].find(i => !excluded.has(i)) ?? idxFast;

//         const named = candidates.map((s, i) => {
//           let name: RouteOption['name'] = '권장길';
//           if (i === idxFast) name = '빠른길';
//           else if (i === idxEasy) name = '쉬운길';
//           else if (i === idxBal) name = '권장길';
//           return { ...s, id: `route-${i}`, name };
//         });

//         const ord = { '빠른길': 0, '권장길': 1, '쉬운길': 2 } as const;
//         named.sort((a, b) => ord[a.name] - ord[b.name]);

//         setRouteOptions(named);
//         setSelectedRouteIdx(0);
//         setAutoRoutePath(named[0].path);
//         setAutoRouteInfo({ totalDistance: named[0].distanceM, totalTime: named[0].timeSec });

//         if (map && named[0].path.length > 0) {
//           const bounds = new kakao.maps.LatLngBounds();
//           named[0].path.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
//           map.setBounds(bounds);
//         }
//       } catch {
//         setAutoRouteError('경로를 불러오지 못했습니다.');
//       } finally {
//         setAutoRouteLoading(false);
//       }
//     },
//     [map, resetRoutePlaces]
//   );

//   // 경로 카드 선택/상세 열기
//   const selectRoute = useCallback((i: number) => {
//     if (!routeOptions[i]) return;
//     setSelectedRouteIdx(i);
//     setAutoRoutePath(routeOptions[i].path);
//     setAutoRouteInfo({ totalDistance: routeOptions[i].distanceM, totalTime: routeOptions[i].timeSec });
//     setDetailOpen(false);
//     resetRoutePlaces?.();
//   }, [routeOptions, resetRoutePlaces]);

//   const openRouteDetail = useCallback(async (i: number) => {
//     if (!routeOptions[i]) return;
//     const r = routeOptions[i];
//     setSelectedRouteIdx(i);
//     setAutoRoutePath(r.path);
//     setAutoRouteInfo({ totalDistance: r.distanceM, totalTime: r.timeSec });
//     await searchAlongPath(r.path);
//     setDetailOpen(true);
//   }, [routeOptions, searchAlongPath]);

//   // 맛집 포커스
//   const focusRoutePlaceOnMap = useCallback((p: { id?: string; name?: string; lat: number|string; lng: number|string }) => {
//     if (!p) return;
//     const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
//     const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
//     if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
//     const key = makeRouteKey({ ...p, lat, lng });
//     setFocusedRouteKey(key);
//     panToPlace(lat, lng, 3);
//   }, [panToPlace]);

//   // 지도 클릭
//   const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
//     const clickedLatLng = mouseEvent.latLng;
//     setFocusedRouteKey(null);

//     if (isDistanceMode) {
//       const newPts = [...distancePoints, clickedLatLng];
//       if (newPts.length === 1) { setDistancePoints(newPts); setDistanceKm(null); return; }
//       if (newPts.length === 2) {
//         const [p1, p2] = newPts;
//         const km = getDistanceFromLatLonInKm(p1.getLat(), p1.getLng(), p2.getLat(), p2.getLng());
//         setDistancePoints(newPts); setDistanceKm(km); return;
//       }
//       setDistancePoints([clickedLatLng]); setDistanceKm(null); return;
//     }

//     if (isRouteMode) {
//       const next = [...routeSelectPoints, clickedLatLng];
//       if (next.length === 1) {
//         setRouteSelectPoints(next);
//         setRouteError(null); setRoutePath([]); setRouteInfo(null);
//         return;
//       }
//       if (next.length === 2) {
//         const [s, e] = next;
//         runManualRoute(
//           new kakao.maps.LatLng(s.getLat(), s.getLng()),
//           new kakao.maps.LatLng(e.getLat(), e.getLng())
//         );
//         return;
//       }
//       setRouteSelectPoints([clickedLatLng]);
//       setRoutePath([]); setRouteInfo(null); setRouteError(null);
//       return;
//     }
//   };

//   const formatDistance = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`);
//   const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
//   const rightBase = showRelatedPosts ? 320 : 10;
//   const currentKeyword = useMemo(() => selectedPlace?.place_name ?? '', [selectedPlace]);

//   /* =========================
//      개미행렬 애니메이션
//   ========================= */
//   const DASH_LEN = 120;
//   const GAP_LEN = 170;

//   const routeCum = useMemo(() => (routePath.length > 1 ? buildCumulativeDist(routePath) : [0]), [routePath]);
//   const autoCum  = useMemo(() => (autoRoutePath.length > 1 ? buildCumulativeDist(autoRoutePath) : [0]), [autoRoutePath]);

//   const [routePhase, setRoutePhase] = useState(0);
//   const [autoPhase, setAutoPhase]   = useState(0);

//   useEffect(() => {
//     let raf = 0;
//     let last = performance.now();
//     const tick = (now: number) => {
//       const dt = (now - last) / 1000;
//       last = now;
//       setRoutePhase(p => p + dt * 100);
//       setAutoPhase(p  => p + dt * 120);
//       raf = requestAnimationFrame(tick);
//     };
//     raf = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   function makeAntSegments(path: LatLng[], cum: number[], phase: number, dashLen: number, gapLen: number, cap = 2000) {
//     const total = cum[cum.length - 1] || 0;
//     if (total <= 0 || path.length < 2) return [] as LatLng[][];
//     const period = dashLen + gapLen;
//     if (period <= 0) return [];
//     let startS = ((phase % period) + period) % period;
//     const needed = Math.ceil(total / period) + 2;
//     const budget = Math.min(cap, needed);
//     const segs: LatLng[][] = [];
//     for (let s = startS, n = 0; s < total && n < budget; s += period, n++) {
//       const a = s;
//       const b = Math.min(s + dashLen, total);
//       const seg = slicePathRange(path, cum, a, b);
//       if (seg.length >= 2) segs.push(seg);
//     }
//     return segs;
//   }

//   const routeBorderSegs = useMemo(
//     () => makeAntSegments(routePath, routeCum, routePhase, DASH_LEN, GAP_LEN, 2000),
//     [routePath, routeCum, routePhase]
//   );
//   const autoBorderSegs  = useMemo(
//     () => makeAntSegments(autoRoutePath, autoCum, autoPhase, DASH_LEN, GAP_LEN, 2000),
//     [autoRoutePath, autoCum, autoPhase]
//   );

//   const fmtTime = (sec: number) => {
//     const m = Math.round(sec / 60);
//     if (m < 60) return `${m}분`;
//     const h = Math.floor(m / 60), mm = m % 60;
//     return `${h}시간 ${mm}분`;
//   };
//   const fmtDist = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
//   const fastest = routeOptions.length ? Math.min(...routeOptions.map(r => r.timeSec)) : 0;

//   return (
//     <div className='main-wrapper'>
//       <SearchSidebar
//         searchResults={searchResults}
//         onClickItem={handlePlaceClick}
//         selectedIndex={selectedIndex}
//         isOpen={isSidebarOpen}
//         toggleOpen={toggleSidebar}
//         onSearch={handleSearch}
//         onRouteByCoords={handleRouteByCoords}
//         routePlaces={routePlaces}
//         routeLoading={routePlacesLoading}
//         routeError={routePlacesError ?? null}
//         onFocusRoutePlace={focusRoutePlaceOnMap}

//         /* 3경로 리스트용 */
//         routeOptions={routeOptions}
//         selectedRouteIdx={selectedRouteIdx}
//         onSelectRoute={selectRoute}
//         onOpenRouteDetail={openRouteDetail}

//         /* 우측 상세가 열려있으면 왼쪽 맛집 리스트는 숨김(없앰) */
//         showRoutePlacesInSidebar={false}
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
//         style={{ top: 3, right: (showRelatedPosts ? 320 : 10) + 120 }}
//       >
//         {isDistanceMode ? '일직선 거리 종료' : '일직선 거리'}
//       </button>
//       <button
//         className={`distance-toggle-button ${isRouteMode ? 'active' : ''}`}
//         onClick={toggleRouteMode}
//         style={{ top: 3, right: showRelatedPosts ? 320 : 10 }}
//       >
//         {isRouteMode ? '두 지점 경로 종료' : '두 지점 경로'}
//       </button>

//       {isDistanceMode && distanceKm !== null && (
//         <div className="distance-overlay">선택된 두 지점 사이의 직선 거리는 약 { (distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(2)} km`) } 입니다.</div>
//       )}
//       {isRouteMode && (routeLoading || routeError || routeInfo) && (
//         <div className="distance-overlay">
//           {routeLoading && '경로를 불러오는 중...'}
//           {!routeLoading && routeError && routeError}
//           {!routeLoading && !routeError && routeInfo && (
//             <>
//               보행자 경로&nbsp;
//               {routeInfo.totalDistance != null && <>거리: {routeInfo.totalDistance < 1000 ? `${routeInfo.totalDistance} m` : `${(routeInfo.totalDistance / 1000).toFixed(2)} km`}&nbsp;</>}
//               {routeInfo.totalTime != null && <>시간: {`${Math.round((routeInfo.totalTime) / 60)} min`}</>}
//             </>
//           )}
//         </div>
//       )}

//       {autoRoutePath.length > 0 && (
//         <div className="distance-overlay" style={{ top: 60 }}>
//           선택 경로 표시 중&nbsp;
//           {autoRouteInfo?.totalDistance != null && <>거리: {autoRouteInfo.totalDistance < 1000 ? `${autoRouteInfo.totalDistance} m` : `${(autoRouteInfo.totalDistance / 1000).toFixed(2)} km`}&nbsp;</>}
//           {autoRouteInfo?.totalTime != null && <>시간: {`${Math.round((autoRouteInfo.totalTime) / 60)} min`}</>}
//           &nbsp;|&nbsp;
//           <button onClick={resetAutoRoute} style={{ textDecoration: 'underline' }}>경로 지우기</button>
//         </div>
//       )}
//       {autoRouteLoading && <div className="distance-overlay" style={{ top: 60 }}>경로 계산 중…</div>}
//       {autoRouteError && <div className="distance-overlay" style={{ top: 60 }}>{autoRouteError}</div>}

//       {/* 오른쪽 상세/맛집 패널 */}
//       <div className={`route-detail-panel ${detailOpen ? 'open' : ''}`}>
//         <div className="route-detail-header">
//           <div className="route-detail-title">
//             {routeOptions[selectedRouteIdx]?.name || '경로 상세'}
//           </div>
//           <button className="route-detail-close" onClick={() => setDetailOpen(false)}>×</button>
//         </div>
//         <div className="route-detail-summary">
//           {routeOptions[selectedRouteIdx] && (
//             <>
//               <div>시간 {fmtTime(routeOptions[selectedRouteIdx].timeSec)} · 거리 {fmtDist(routeOptions[selectedRouteIdx].distanceM)}</div>
//               <div className="route-detail-hint">리스트 항목을 클릭하면 지도가 해당 위치로 이동합니다.</div>
//             </>
//           )}
//         </div>
//         <div className="route-detail-body">
//           {routePlacesLoading && <div>맛집 검색 중…</div>}
//           {routePlacesError && <div className="error-text">{routePlacesError}</div>}
//           {!routePlacesLoading && !routePlacesError && <PlaceList places={routePlaces as any} onFocusPlace={focusRoutePlaceOnMap} />}
//         </div>
//       </div>

//       <Map
//         center={center}
//         style={{ width: '100%', height: '100vh' }}
//         level={4}
//         onClick={handleMapClick}
//         onCreate={(m) => {
//           setMap(m);
//           try { (m as any).setZoomable?.(true); } catch { /* ignore */ }
//         }}
//         className="map"
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
//               <div className="marker-info"><strong>{place.place_name}</strong></div>
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
//           <>
//             <Polyline path={routePath} strokeWeight={5} strokeColor={'#8a2ea1ff'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={5} />
//             {routeBorderSegs.map((seg, i) => (
//               <Polyline key={`rborder-${i}`} path={seg} strokeWeight={7} strokeColor={'#FFFFFF'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={6} />
//             ))}
//           </>
//         )}

//         {routeOptions.map((r, i) => {
//           const selected = i === selectedRouteIdx;
//           return (
//             <Polyline
//               key={`opt-${r.id}`}
//               path={r.path}
//               strokeWeight={selected ? 7 : 4}
//               strokeColor={selected ? '#8a2ea1ff' : '#8a8a8a'}
//               strokeOpacity={selected ? 0.95 : 0.5}
//               strokeStyle={selected ? 'solid' : 'dash'}
//               zIndex={selected ? 6 : 4}
//             />
//           );
//         })}

//         {autoRouteEndpoints?.start && <MapMarker key="auto-start" position={{ lat: autoRouteEndpoints.start.lat, lng: autoRouteEndpoints.start.lng }} />}
//         {autoRouteEndpoints?.end &&   <MapMarker key="auto-end"   position={{ lat: autoRouteEndpoints.end.lat,   lng: autoRouteEndpoints.end.lng }} />}
//         {autoRoutePath.length > 1 && (
//           <>
//             <Polyline path={autoRoutePath} strokeWeight={6} strokeColor={'#8a2ea1ff'} strokeOpacity={0.95} strokeStyle={'solid'} zIndex={5} />
//             {autoBorderSegs.map((seg, i) => (
//               <Polyline key={`aborder-${i}`} path={seg} strokeWeight={8} strokeColor={'#FFFFFF'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={6} />
//             ))}
//           </>
//         )}

//         {routePlaces && routePlaces.map((p, idx) => {
//           const lat = typeof (p as any).lat === 'string' ? parseFloat((p as any).lat) : (p as any).lat;
//           const lng = typeof (p as any).lng === 'string' ? parseFloat((p as any).lng) : (p as any).lng;
//           if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
//           const key = makeRouteKey({ ...p, lat, lng });
//           const isFocused = focusedRouteKey === key;
//           return (
//             <React.Fragment key={`routeplace-${key}-${idx}`}>
//               <MapMarker
//                 position={{ lat, lng }}
//                 onClick={() => { setFocusedRouteKey(key); panToPlace(lat, lng, 3); }}
//                 clickable
//               />
//               {isFocused && (
//                 <CustomOverlayMap position={{ lat, lng }} yAnchor={1.25} zIndex={9}>
//                   <div className="km-label">{(p as any).name}</div>
//                 </CustomOverlayMap>
//               )}
//             </React.Fragment>
//           );
//         })}
//       </Map>

//       <div><ChatBotButton/></div>
//     </div>
//   );
// }

// src/views/Main/index.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
import PlaceDetailCard, { PlaceDetail } from 'components/Map/PlaceDetailCard'; // [ADDED]
import { BoardListItem } from 'types/interface';
import { getSearchBoardListRequest } from 'apis';
import { usePlacesAlongPath } from 'hooks/Map/usePlacesAlongPath';
import PlaceList from 'components/Map/PlaceList';
import './style.css';
import 'components/Map/marker-label.css';
import ChatBotButton from 'components/ChatBot/ChatBotButton';

const BOARD_DETAIL_PATH = '/board/detail';
declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

/* =========================
   공통 유틸
========================= */
type LatLng = { lat: number; lng: number };

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
const toNum = (v: any) => typeof v === 'string' ? Number(v) : v;
const makeRouteKey = (p: any) => (p?.id && `${p.id}`) || `${toNum(p?.lat)},${toNum(p?.lng)}`;

/* =========================
   경로 기하 유틸(누적거리/보간/세그먼트)
========================= */
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function haversine(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)); // meters
}
function bearing(a: LatLng, b: LatLng) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return Math.atan2(y, x); // radians
}
function buildCumulativeDist(path: LatLng[]) {
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversine(path[i - 1], path[i]);
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
function slicePathRange(path: LatLng[], cum: number[], a: number, b: number): LatLng[] {
  const total = cum[cum.length - 1] || 0;
  if (total <= 0 || path.length < 2) return [];
  if (a < 0) a = 0;
  if (b > total) b = total;
  if (b <= a) return [];
  const start = interpolateAt(path, cum, a);
  const end = interpolateAt(path, cum, b);
  const seg: LatLng[] = [start];
  for (let i = 1; i < path.length; i++) if (cum[i] > a && cum[i] < b) seg.push(path[i]);
  seg.push(end);
  return seg;
}
function offsetByMeters(p: LatLng, azimuthRad: number, d: number, leftOrRight: 'left' | 'right'): LatLng {
  const mPerDegLat = 110540;
  const mPerDegLng = 111320 * Math.cos(toRad(p.lat));
  const theta = azimuthRad + (leftOrRight === 'left' ? -Math.PI / 2 : Math.PI / 2);
  const dx = (d * Math.cos(theta)) / mPerDegLng;
  const dy = (d * Math.sin(theta)) / mPerDegLat;
  return { lat: p.lat + dy, lng: p.lng + dx };
}
function makeOffsetVias(basePath: LatLng[], d = 60): { left?: LatLng; right?: LatLng } {
  if (!basePath || basePath.length < 2) return {};
  let total = 0;
  const segLen: number[] = [];
  for (let i = 1; i < basePath.length; i++) {
    const L = haversine(basePath[i - 1], basePath[i]);
    segLen.push(L);
    total += L;
  }
  if (total === 0) return {};
  const target = total / 2;

  let acc = 0;
  let idx = 0;
  for (; idx < segLen.length; idx++) {
    if (acc + segLen[idx] >= target) break;
    acc += segLen[idx];
  }
  const i = Math.min(Math.max(0, idx), basePath.length - 2);
  const a = basePath[i];
  const b = basePath[i + 1];

  const az = bearing(a, b);
  const mid: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  return {
    left: offsetByMeters(mid, az, d, 'left'),
    right: offsetByMeters(mid, az, d, 'right'),
  };
}
function complexityScore(path: LatLng[]): number {
  if (!path || path.length < 3) return 0;
  let turnSum = 0, zigzag = 0, shortSeg = 0, totalLen = 0, prevSign = 0;
  for (let i = 1; i < path.length; i++) {
    const seg = haversine(path[i - 1], path[i]);
    totalLen += seg;
    if (seg <= 20) shortSeg++;
    if (i < path.length - 1) {
      const a = bearing(path[i - 1], path[i]);
      const b = bearing(path[i], path[i + 1]);
      let d = b - a;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const deg = Math.abs(toDeg(d));
      if (deg > 30) {
        const sev = (deg / 90) ** 1.3;
        turnSum += sev;
        const sign = d > 0 ? 1 : -1;
        if (prevSign && sign !== prevSign) zigzag++;
        prevSign = sign;
      }
    }
  }
  if (totalLen === 0) return 0;
  const perKm = totalLen / 1000;
  const shortRate = shortSeg / Math.max(1, path.length - 1);
  const zigzagRate = zigzag / Math.max(1, path.length - 2);
  const alpha = 0.5, beta = 0.3;
  return turnSum / perKm + alpha * shortRate + beta * zigzagRate;
}

/* =========================
   Main 컴포넌트
========================= */
export default function Main() {
  const { searchResults, center, searchPlaces } = useKakaoSearch();

  // map 상태
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 직선거리
  const [isDistanceMode, setIsDistanceMode] = useState(false);
  const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // 두 지점 경로(지도 클릭)
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 사이드바 경로(선택 경로를 맵에 강조 표시)
  const [autoRoutePath, setAutoRoutePath] = useState<LatLng[]>([]);
  const [autoRouteInfo, setAutoRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [autoRouteEndpoints, setAutoRouteEndpoints] = useState<{ start?: LatLng; end?: LatLng } | null>(null);
  const [autoRouteLoading, setAutoRouteLoading] = useState(false);
  const [autoRouteError, setAutoRouteError] = useState<string | null>(null);

  // 3경로 옵션
  type RouteOption = {
    id: string;
    name: '빠른길' | '권장길' | '쉬운길';
    path: LatLng[];
    timeSec: number;
    distanceM: number;
    complexity: number;
  };
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  // 경로 주변 맛집
  const {
    places: routePlaces,
    loading: routePlacesLoading,
    error: routePlacesError,
    search: searchAlongPath,
    reset: resetRoutePlaces,
  } = usePlacesAlongPath();
  const [focusedRouteKey, setFocusedRouteKey] = useState<string | null>(null);

  // 연관 게시물 (데이터 유지용)
  const [showRelatedPosts, setShowRelatedPosts] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  // NEW: 네이버맵식 카드 상태 (경로 선택 시 동작)
  const [placeCardOpen, setPlaceCardOpen] = useState(false);
  const [routeTargetPlace, setRouteTargetPlace] = useState<PlaceDetail | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // 뒤로가기 복원
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
  const handleSearch = (start: string) => {
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

  // 부드러운 이동
  const panToPlace = useCallback((lat: number, lng: number, targetLevel: number | null = 3) => {
    if (!map) return;
    const pos = new kakao.maps.LatLng(lat, lng);
    if (targetLevel != null) {
      try {
        const cur = map.getLevel?.() ?? null;
        if (cur == null || cur > targetLevel) (map as any).setLevel(targetLevel, { animate: true });
      } catch { map.setLevel(targetLevel as number); }
    }
    map.panTo(pos);
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
    // 기존: 연관 게시물 패널 트리거
    // if (place?.place_name) loadRelatedPosts(place.place_name);
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
  const resetAutoRoute = () => {
    setAutoRouteEndpoints(null);
    setAutoRoutePath([]);
    setAutoRouteInfo(null);
    setAutoRouteLoading(false);
    setAutoRouteError(null);
    resetRoutePlaces?.();
    setFocusedRouteKey(null);
    setRouteOptions([]);
  };

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

  // Tmap 호출
  const callTmap = (body: { start: LatLng; end: LatLng; viaPoints?: LatLng[] }) =>
    fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

    callTmap({ start: { lat: sLL.getLat(), lng: sLL.getLng() }, end: { lat: eLL.getLat(), lng: eLL.getLng() } })
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

  /* =========================
     사이드바 경로: 보행자 3경로 생성 (V1)
  ========================= */
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRouteByCoords = useCallback(
    async (start: { lat: number; lng: number; name: string }, end: { lat: number; lng: number; name: string }) => {
      setAutoRouteLoading(true);
      setAutoRouteError(null);
      setAutoRoutePath([]);
      setAutoRouteInfo(null);
      setAutoRouteEndpoints({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
      resetRoutePlaces?.();
      setFocusedRouteKey(null);
      setDetailOpen(false);
      setRouteOptions([]);

      // NEW: 카드 대상(도착지) 저장, 아직 열지 않음
      setRouteTargetPlace({
        name: end.name ?? '도착지',
        categoryText: '도착지',
      } as PlaceDetail);
      setPlaceCardOpen(false);

      try {
        // 1) 기본 경로
        const geo0 = await callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
        const feat0 = geo0?.features ?? [];
        const line0 = feat0.filter((f: any) => f?.geometry?.type === 'LineString');
        const path0: LatLng[] = line0.flatMap((f: any) =>
          (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
        );
        const sum0 = feat0.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime)?.properties ?? {};
        const time0 = Number(sum0.totalTime ?? sum0.time ?? 0);
        const dist0 = Number(sum0.totalDistance ?? sum0.distance ?? 0);

        if (path0.length < 2) throw new Error('경로가 비어 있습니다.');

        // 2) via 오프셋 생성
        const vias = makeOffsetVias(path0, 60);
        const promises: Array<Promise<any>> = [Promise.resolve(geo0)];
        if (vias.left)  promises.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng }, viaPoints: [vias.left] }));
        if (vias.right) promises.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end:   { lat: end.lat,   lng: end.lng   }, viaPoints: [vias.right] } as any)); // TS 회피용

        const geos = await Promise.all(promises);

        // 3) 후보 경로 파싱/점수화
        const candidates: RouteOption[] = geos.map((geo: any, idx: number): RouteOption => {
          const fs = geo?.features ?? [];
          const ls = fs.filter((f: any) => f?.geometry?.type === 'LineString');
          const path: LatLng[] = ls.flatMap((f: any) =>
            (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
          );
          const s = fs.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime)?.properties ?? {};
          const t = Number(s.totalTime ?? s.time ?? 0);
          const d = Number(s.totalDistance ?? s.distance ?? 0);

          return {
            id: `cand-${idx}`,
            name: '권장길',
            path,
            timeSec: Math.round(t),
            distanceM: Math.round(d),
            complexity: complexityScore(path),
          };
        }).filter(c => c.path.length > 1);

        if (candidates.length === 0) throw new Error('대안 경로 생성에 실패했습니다.');

        // 4) 라벨링
        const times = candidates.map(s => s.timeSec);
        const comps = candidates.map(s => s.complexity);
        const tMin = Math.min(...times), tMax = Math.max(...times);
        const cMin = Math.min(...comps), cMax = Math.max(...comps);
        const norm = (v: number, lo: number, hi: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));

        const pickMinIdx = (arr: number[], exclude = new Set<number>()) => {
          let best = -1, bestVal = Infinity;
          arr.forEach((v, i) => { if (!exclude.has(i) && v < bestVal) { best = i; bestVal = v; } });
          return best;
        };

        const idxFast = pickMinIdx(times);
        const excluded = new Set<number>([idxFast]);
        let idxEasy = pickMinIdx(comps, excluded);
        if (idxEasy === -1) idxEasy = idxFast;
        excluded.add(idxEasy);

        const balScore = candidates.map(s => 0.8 * norm(s.timeSec, tMin, tMax) + 0.2 * norm(s.complexity, cMin, cMax));
        let idxBal = pickMinIdx(balScore, excluded);
        if (idxBal === -1) idxBal = [0,1,2].find(i => !excluded.has(i)) ?? idxFast;

        const named = candidates.map((s, i) => {
          let name: RouteOption['name'] = '권장길';
          if (i === idxFast) name = '빠른길';
          else if (i === idxEasy) name = '쉬운길';
          else if (i === idxBal) name = '권장길';
          return { ...s, id: `route-${i}`, name };
        });

        const ord = { '빠른길': 0, '권장길': 1, '쉬운길': 2 } as const;
        named.sort((a, b) => ord[a.name] - ord[b.name]);

        setRouteOptions(named);
        setSelectedRouteIdx(0);
        setAutoRoutePath(named[0].path);
        setAutoRouteInfo({ totalDistance: named[0].distanceM, totalTime: named[0].timeSec });

        if (map && named[0].path.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          named[0].path.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
          map.setBounds(bounds);
        }
      } catch {
        setAutoRouteError('경로를 불러오지 못했습니다.');
      } finally {
        setAutoRouteLoading(false);
      }
    },
    [map, resetRoutePlaces]
  );

  // 경로 카드 선택/상세 열기 => 맛집 검색 + 카드 열기('pois' 탭)
  const selectRoute = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    setSelectedRouteIdx(i);
    setAutoRoutePath(routeOptions[i].path);
    setAutoRouteInfo({ totalDistance: routeOptions[i].distanceM, totalTime: routeOptions[i].timeSec });
    setDetailOpen(false);
    resetRoutePlaces?.();

    await searchAlongPath(routeOptions[i].path);
    setPlaceCardOpen(true);
  }, [routeOptions, resetRoutePlaces, searchAlongPath]);

  const openRouteDetail = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    const r = routeOptions[i];
    setSelectedRouteIdx(i);
    setAutoRoutePath(r.path);
    setAutoRouteInfo({ totalDistance: r.distanceM, totalTime: r.timeSec });

    await searchAlongPath(r.path);
    setPlaceCardOpen(true);

    // 우측 패널은 더 이상 필요 없으면 주석 유지
    // setDetailOpen(true);
  }, [routeOptions, searchAlongPath]);

  // 맛집 포커스
  const focusRoutePlaceOnMap = useCallback((p: { id?: string; name?: string; lat: number|string; lng: number|string }) => {
    if (!p) return;
    const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
    const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = makeRouteKey({ ...p, lat, lng });
    setFocusedRouteKey(key);
    panToPlace(lat, lng, 3);
  }, [panToPlace]);

  // 지도 클릭
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
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  /* =========================
     개미행렬 애니메이션
  ========================= */
  const DASH_LEN = 120;
  const GAP_LEN = 170;

  const routeCum = useMemo(() => (routePath.length > 1 ? buildCumulativeDist(routePath) : [0]), [routePath]);
  const autoCum  = useMemo(() => (autoRoutePath.length > 1 ? buildCumulativeDist(autoRoutePath) : [0]), [autoRoutePath]);

  const [routePhase, setRoutePhase] = useState(0);
  const [autoPhase, setAutoPhase]   = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRoutePhase(p => p + dt * 100);
      setAutoPhase(p  => p + dt * 120);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function makeAntSegments(path: LatLng[], cum: number[], phase: number, dashLen: number, gapLen: number, cap = 2000) {
    const total = cum[cum.length - 1] || 0;
    if (total <= 0 || path.length < 2) return [] as LatLng[][];
    const period = dashLen + gapLen;
    if (period <= 0) return [];
    let startS = ((phase % period) + period) % period;
    const needed = Math.ceil(total / period) + 2;
    const budget = Math.min(cap, needed);
    const segs: LatLng[][] = [];
    for (let s = startS, n = 0; s < total && n < budget; s += period, n++) {
      const a = s;
      const b = Math.min(s + dashLen, total);
      const seg = slicePathRange(path, cum, a, b);
      if (seg.length >= 2) segs.push(seg);
    }
    return segs;
  }

  const routeBorderSegs = useMemo(
    () => makeAntSegments(routePath, routeCum, routePhase, DASH_LEN, GAP_LEN, 2000),
    [routePath, routeCum, routePhase]
  );
  const autoBorderSegs  = useMemo(
    () => makeAntSegments(autoRoutePath, autoCum, autoPhase, DASH_LEN, GAP_LEN, 2000),
    [autoRoutePath, autoCum, autoPhase]
  );

  const fmtTime = (sec: number) => {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}분`;
    const h = Math.floor(m / 60), mm = m % 60;
    return `${h}시간 ${mm}분`;
  };
  const fmtDist = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

  // 카드: 출발/도착 버튼(도착 좌표 사용)
  const onClickStartFromCard = useCallback((p: PlaceDetail) => {
    const end = autoRouteEndpoints?.end;
    if (!end) return;
    setIsRouteMode(true);
    setIsDistanceMode(false);
    setRouteSelectPoints([new kakao.maps.LatLng(end.lat, end.lng)]);
    panToPlace(end.lat, end.lng, 3);
  }, [autoRouteEndpoints, panToPlace]);

  const onClickDestFromCard = useCallback((p: PlaceDetail) => {
    const end = autoRouteEndpoints?.end;
    if (!end) return;

    if (routeSelectPoints.length === 1) {
      // 이미 시작점이 있음 → 바로 경로 실행
      runManualRoute(routeSelectPoints[0], new kakao.maps.LatLng(end.lat, end.lng));
    } else {
      // 시작점이 아직 없으면 도착 좌표를 시작점으로 임시 설정
      setIsRouteMode(true);
      setRouteSelectPoints([new kakao.maps.LatLng(end.lat, end.lng)]);
    }
    panToPlace(end.lat, end.lng, 3);
  }, [autoRouteEndpoints, routeSelectPoints, panToPlace]);

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
        routePlaces={routePlaces}
        routeLoading={routePlacesLoading}
        routeError={routePlacesError ?? null}
        onFocusRoutePlace={focusRoutePlaceOnMap}

        /* 3경로 리스트용 */
        routeOptions={routeOptions}
        selectedRouteIdx={selectedRouteIdx}
        onSelectRoute={selectRoute}
        onOpenRouteDetail={openRouteDetail}

        /* 우측 상세가 열려있으면 왼쪽 맛집 리스트는 숨김(없앰) */
        showRoutePlacesInSidebar={false}
      />

      {/* [ADDED] 네이버맵식 가운데-좌측 플로팅 카드 */}
      {routeTargetPlace && (
        <PlaceDetailCard
          open={placeCardOpen}
          place={routeTargetPlace}
          onClose={() => setPlaceCardOpen(false)}
          onClickStart={onClickStartFromCard}
          onClickDest={onClickDestFromCard}
          leftSidebarWidth={340}
          gap={16}
          topOffset={64}
          width={520}
        >
          {routePlacesLoading && <div>맛집 검색 중…</div>}
          {routePlacesError && <div className="error-text">{routePlacesError}</div>}
          {!routePlacesLoading && !routePlacesError && (
            <>
              <div className="pd-list-summary">
               경로 주변 맛집 <b>총 {Array.isArray(routePlaces) ? routePlaces.length : 0}곳</b>
             </div>
              <PlaceList places={routePlaces as any} onFocusPlace={focusRoutePlaceOnMap} />
            </>
          )}
        </PlaceDetailCard>
      )}

      <button
        className={`distance-toggle-button ${isDistanceMode ? 'active' : ''}`}
        onClick={toggleDistanceMode}
        style={{ top: 3, right: (showRelatedPosts ? 320 : 10) + 120 }}
      >
        {isDistanceMode ? '일직선 거리 종료' : '일직선 거리'}
      </button>
      <button
        className={`distance-toggle-button ${isRouteMode ? 'active' : ''}`}
        onClick={toggleRouteMode}
        style={{ top: 3, right: showRelatedPosts ? 320 : 10 }}
      >
        {isRouteMode ? '두 지점 경로 종료' : '두 지점 경로'}
      </button>

      {isDistanceMode && distanceKm !== null && (
        <div className="distance-overlay">선택된 두 지점 사이의 직선 거리는 약 { (distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(2)} km`) } 입니다.</div>
      )}
      {isRouteMode && (routeLoading || routeError || routeInfo) && (
        <div className="distance-overlay">
          {routeLoading && '경로를 불러오는 중...'}
          {!routeLoading && routeError && routeError}
          {!routeLoading && !routeError && routeInfo && (
            <>
              보행자 경로&nbsp;
              {routeInfo.totalDistance != null && <>거리: {routeInfo.totalDistance < 1000 ? `${routeInfo.totalDistance} m` : `${(routeInfo.totalDistance / 1000).toFixed(2)} km`}&nbsp;</>}
              {routeInfo.totalTime != null && <>시간: {`${Math.round((routeInfo.totalTime) / 60)} min`}</>}
            </>
          )}
        </div>
      )}

      {autoRoutePath.length > 0 && (
        <div className="distance-overlay" style={{ top: 60 }}>
          선택 경로 표시 중&nbsp;
          {autoRouteInfo?.totalDistance != null && <>거리: {autoRouteInfo.totalDistance < 1000 ? `${autoRouteInfo.totalDistance} m` : `${(autoRouteInfo.totalDistance / 1000).toFixed(1)} km`}&nbsp;</>}
          {autoRouteInfo?.totalTime != null && <>시간: {`${Math.round((autoRouteInfo.totalTime) / 60)} min`}</>}
          &nbsp;|&nbsp;
          <button onClick={resetAutoRoute} style={{ textDecoration: 'underline' }}>경로 지우기</button>
        </div>
      )}
      {autoRouteLoading && <div className="distance-overlay" style={{ top: 60 }}>경로 계산 중…</div>}
      {autoRouteError && <div className="distance-overlay" style={{ top: 60 }}>{autoRouteError}</div>}

      {/* 오른쪽 상세/맛집 패널은 더 이상 사용하지 않아 주석 처리 */}
      {/*
      <div className={`route-detail-panel ${detailOpen ? 'open' : ''}`}>
        <div className="route-detail-header">
          <div className="route-detail-title">
            {routeOptions[selectedRouteIdx]?.name || '경로 상세'}
          </div>
          <button className="route-detail-close" onClick={() => setDetailOpen(false)}>×</button>
        </div>
        <div className="route-detail-summary">
          {routeOptions[selectedRouteIdx] && (
            <>
              <div>시간 {fmtTime(routeOptions[selectedRouteIdx].timeSec)} · 거리 {fmtDist(routeOptions[selectedRouteIdx].distanceM)}</div>
              <div className="route-detail-hint">리스트 항목을 클릭하면 지도가 해당 위치로 이동합니다.</div>
            </>
          )}
        </div>
        <div className="route-detail-body">
          {routePlacesLoading && <div>맛집 검색 중…</div>}
          {routePlacesError && <div className="error-text">{routePlacesError}</div>}
          {!routePlacesLoading && !routePlacesError && <PlaceList places={routePlaces as any} onFocusPlace={focusRoutePlaceOnMap} />}
        </div>
      </div>
      */}

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
          <>
            <Polyline path={routePath} strokeWeight={5} strokeColor={'#8a2ea1ff'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={5} />
            {routeBorderSegs.map((seg, i) => (
              <Polyline key={`rborder-${i}`} path={seg} strokeWeight={7} strokeColor={'#FFFFFF'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={6} />
            ))}
          </>
        )}

        {routeOptions.map((r, i) => {
          const selected = i === selectedRouteIdx;
          return (
            <Polyline
              key={`opt-${r.id}`}
              path={r.path}
              strokeWeight={selected ? 7 : 4}
              strokeColor={selected ? '#8a2ea1ff' : '#8a8a8a'}
              strokeOpacity={selected ? 0.95 : 0.5}
              strokeStyle={selected ? 'solid' : 'dash'}
              zIndex={selected ? 6 : 4}
            />
          );
        })}

        {autoRouteEndpoints?.start && <MapMarker key="auto-start" position={{ lat: autoRouteEndpoints.start.lat, lng: autoRouteEndpoints.start.lng }} />}
        {autoRouteEndpoints?.end &&   <MapMarker key="auto-end"   position={{ lat: autoRouteEndpoints.end.lat,   lng: autoRouteEndpoints.end.lng }} />}
        {autoRoutePath.length > 1 && (
          <>
            <Polyline path={autoRoutePath} strokeWeight={6} strokeColor={'#8a2ea1ff'} strokeOpacity={0.95} strokeStyle={'solid'} zIndex={5} />
            {autoBorderSegs.map((seg, i) => (
              <Polyline key={`aborder-${i}`} path={seg} strokeWeight={8} strokeColor={'#FFFFFF'} strokeOpacity={0.9} strokeStyle={'solid'} zIndex={6} />
            ))}
          </>
        )}

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

