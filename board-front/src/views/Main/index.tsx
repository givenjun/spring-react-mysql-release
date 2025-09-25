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
import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl } from 'react-kakao-maps-sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
import RelatedPostsSidebar from 'components/RelatedPostsSidebar';
import { BoardListItem } from 'types/interface';
import { getSearchBoardListRequest } from 'apis';
import './style.css';
import ChatBotButton from 'components/ChatBot/ChatBotButton';

// 게시글 상세 경로
const BOARD_DETAIL_PATH = '/board/detail';

// -------------------- 공통 유틸 --------------------
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

// 응답 → BoardListItem[]
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

// -------------------- 메인 --------------------
export default function Main() {
  const { searchResults, center, searchPlaces } = useKakaoSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // kakao Map 인스턴스 저장
  const mapRef = useRef<kakao.maps.Map | null>(null);

  // 일직선 거리
  const [isDistanceMode, setIsDistanceMode] = useState(false);
  const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // 경로(보행자)
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 연관 게시물
  const [showRelatedPosts, setShowRelatedPosts] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ---------- 뒤로가기 복원: sessionStorage ----------
  const RESTORE_KEY = 'map:restore';
  const restoreRef = useRef<{ keyword: string } | null>(null);

  const saveBeforeGoDetail = useCallback(() => {
    const keyword = selectedPlace?.place_name;
    if (keyword) {
      sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ keyword }));
    }
  }, [selectedPlace]);

  const tryRestoreOnMount = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(RESTORE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { keyword?: string };
      if (parsed?.keyword) {
        restoreRef.current = { keyword: parsed.keyword };
        searchPlaces(parsed.keyword); // 저장된 키워드로 검색
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [searchPlaces]);

  // 최초 마운트
  useEffect(() => {
    const restored = tryRestoreOnMount();
    if (!restored) {
      searchPlaces('한밭대학교');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색 결과가 바뀌면 복원
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

  // 연관 게시물 로드
  const loadRelatedPosts = async (keyword: string) => {
    setRelatedLoading(true);
    setRelatedError(null);
    try {
      const res = await getSearchBoardListRequest(keyword.trim(), null);
      const list = toBoardListItems(res);
      setRelatedPosts(list);
      setShowRelatedPosts(true);
    } catch {
      setRelatedError('연관 게시물을 불러오지 못했습니다.');
      setRelatedPosts([]);
      setShowRelatedPosts(true);
    } finally {
      setRelatedLoading(false);
    }
  };

  // 마커/리스트 클릭 + 지도 panTo
  const handlePlaceClick = (place: any) => {
    const idx = searchResults.indexOf(place);
    setSelectedIndex(idx);
    setSelectedPlace(place);

    // 지도 자연스러운 이동
    try {
      const lat = Number(place?.y);
      const lng = Number(place?.x);
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && mapRef.current && (window as any).kakao?.maps) {
        const panLatLng = new (window as any).kakao.maps.LatLng(lat, lng);
        mapRef.current.panTo(panLatLng); // 부드러운 이동
        // 레벨 조정이 필요하면 아래 주석 해제 (애니메이션은 브라우저/SDK가 처리)
        // mapRef.current.setLevel(3);
      }
    } catch {
      // ignore
    }

    if (place?.place_name) loadRelatedPosts(place.place_name);
  };

  // 게시글 열기(라우트 이동 전 상태 저장)
  const handleOpenPost = useCallback((boardNumber: string | number) => {
    if (boardNumber === undefined || boardNumber === null) return;
    saveBeforeGoDetail();
    navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`, {
      state: {
        from: location.pathname,
        fromMap: true,
        fromSearch: selectedPlace?.place_name ?? null,
      },
    });
  }, [navigate, location.pathname, selectedPlace, saveBeforeGoDetail]);

  // 모드 전환/리셋
  const resetDistanceState = () => { setDistancePoints([]); setDistanceKm(null); };
  const resetRouteState = () => { setRouteSelectPoints([]); setRoutePath([]); setRouteInfo(null); setRouteLoading(false); setRouteError(null); };

  const toggleDistanceMode = () => {
    setIsDistanceMode(prev => {
      const n = !prev;
      if (n) { setIsRouteMode(false); resetRouteState(); } else { resetDistanceState(); }
      return n;
    });
  };
  const toggleRouteMode = () => {
    setIsRouteMode(prev => {
      const n = !prev;
      if (n) { setIsDistanceMode(false); resetDistanceState(); } else { resetRouteState(); }
      return n;
    });
  };

  // 지도 클릭
  const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    const clickedLatLng = mouseEvent.latLng;

    if (isDistanceMode) {
      const newPts = [...distancePoints, clickedLatLng];
      if (newPts.length === 1) {
        setDistancePoints(newPts);
        setDistanceKm(null);
        return;
      }
      if (newPts.length === 2) {
        const [p1, p2] = newPts;
        const km = getDistanceFromLatLonInKm(p1.getLat(), p1.getLng(), p2.getLat(), p2.getLng());
        setDistancePoints(newPts);
        setDistanceKm(km);
        return;
      }
      setDistancePoints([clickedLatLng]);
      setDistanceKm(null);
      return;
    }

    if (isRouteMode) {
      const next = [...routeSelectPoints, clickedLatLng];
      if (next.length === 1) {
        setRouteSelectPoints(next);
        setRouteError(null);
        setRoutePath([]);
        setRouteInfo(null);
        return;
      }
      if (next.length === 2) {
        setRouteSelectPoints(next);
        setRouteLoading(true);
        setRouteError(null);
        setRoutePath([]);
        setRouteInfo(null);

        const [s, e] = next;
        const start = { lat: s.getLat(), lng: s.getLng() };
        const end = { lat: e.getLat(), lng: e.getLng() };

        fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end })
        })
          .then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
            return r.json();
          })
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
          })
          .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
          .finally(() => setRouteLoading(false));
        return;
      }
      setRouteSelectPoints([clickedLatLng]);
      setRoutePath([]);
      setRouteInfo(null);
      setRouteError(null);
      return;
    }
  };

  const formatDistance = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`);
  const formatMeters = (m?: number) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(2)} km`);
  const formatMinutes = (sec?: number) => (sec == null ? '' : `${Math.round(sec / 60)} min`);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const rightBase = showRelatedPosts ? 320 : 10;

  const currentKeyword = useMemo(() => selectedPlace?.place_name ?? '', [selectedPlace]);

  return (
    <div className='main-wrapper'>
      <SearchSidebar
        searchResults={searchResults}
        onClickItem={handlePlaceClick}
        selectedIndex={selectedIndex}
        isOpen={isSidebarOpen}
        toggleOpen={toggleSidebar}
        onSearch={handleSearch}
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

      {isDistanceMode && distanceKm !== null && (
        <div className="distance-overlay">
          선택된 두 지점 사이의 직선 거리는 약 {formatDistance(distanceKm)} 입니다.
        </div>
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

      <Map
        center={center}
        style={{ width: '100%', height: '100vh' }}
        level={4}
        onClick={handleMapClick}
        onCreate={(map) => { mapRef.current = map; }} // ✅ kakao Map 인스턴스 확보
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
              <div className="marker-info">
                <strong>{place.place_name}</strong>
              </div>
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
          <Polyline
            path={routePath}
            strokeWeight={5}
            strokeColor={'#2E86DE'}
            strokeOpacity={0.8}
            strokeStyle={'solid'}
          />
        )}
      </Map>
      <div>
        <ChatBotButton/>
      </div>
    </div>
  );
}

