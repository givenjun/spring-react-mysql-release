// src/views/Main/index.tsx
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Map, MapMarker, MapTypeControl, Polyline, ZoomControl, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hook';
import PlaceDetailCard, { PlaceDetail } from 'components/Map/PlaceDetailCard';
import { usePlacesAlongPath } from 'hooks/Map/usePlacesAlongPath';
import PlaceList from 'components/Map/PlaceList';
import './style.css';
import 'components/Map/marker-label.css';
import MenuButton from 'components/Menu/MenuButton';
import useRelativeStore from 'stores/relativeStore';

declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

type LatLng = { lat: number; lng: number };
type LL = LatLng;

/* ===== 유틸 ===== */
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function haversine(a: LL, b: LL) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function buildCumulativeDist(path: LL[]) {
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversine(path[i - 1], path[i]);
  return cum;
}
function interpolateAt(path: LL[], cum: number[], s: number): LL {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (s <= 0) return path[0];
  const total = cum[cum.length - 1] || 0;
  if (s >= total) return path[path.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cum[mid] < s) lo = mid + 1; else hi = mid;
  }
  const i = Math.max(1, lo);
  const s0 = cum[i - 1], s1 = cum[i];
  const t = (s - s0) / (s1 - s0);
  const P = path[i - 1], Q = path[i];
  return { lat: P.lat + (Q.lat - P.lat) * t, lng: P.lng + (Q.lng - P.lng) * t };
}
function slicePathRange(path: LL[], cum: number[], a: number, b: number): LL[] {
  const total = cum[cum.length - 1] || 0;
  if (total <= 0 || path.length < 2) return [];
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  a = clamp(a, 0, total);
  b = clamp(b, 0, total);
  if (b <= a) return [];
  const start = interpolateAt(path, cum, a);
  const end   = interpolateAt(path, cum, b);
  const seg: LL[] = [start];
  for (let i = 1; i < path.length; i++) if (cum[i] > a && cum[i] < b) seg.push(path[i]);
  seg.push(end);
  return seg;
}
function bearing(a: LL, b: LL) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return Math.atan2(y, x);
}
function offsetByMeters(p: LL, azimuthRad: number, d: number, side: 'left' | 'right'): LL {
  const mPerDegLat = 110540;
  const mPerDegLng = 111320 * Math.cos(toRad(p.lat));
  const theta = azimuthRad + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
  const dx = (d * Math.cos(theta)) / mPerDegLng;
  const dy = (d * Math.sin(theta)) / mPerDegLat;
  return { lat: p.lat + dy, lng: p.lng + dx };
}
function makeOffsetVias(basePath: LL[], d = 60): { left?: LL; right?: LL } {
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
  for (; idx < segLen.length; idx++) { if (acc + segLen[idx] >= target) break; acc += segLen[idx]; }
  const i = Math.min(Math.max(0, idx), basePath.length - 2);
  const a = basePath[i], b = basePath[i + 1];
  const az = bearing(a, b);
  const mid: LL = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  return { left: offsetByMeters(mid, az, d, 'left'), right: offsetByMeters(mid, az, d, 'right') };
}
function complexityScore(path: LL[]): number {
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
      while (d > Math.PI) d -= Math.PI;
      while (d < -Math.PI) d += Math.PI;
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
  return turnSum / perKm + 0.5 * shortRate + 0.3 * zigzagRate;
}

/* ===== 메인 ===== */
export default function Main() {
  const { setSelectedPlaceName } = useRelativeStore();
  const { searchResults, center, searchPlaces } = useKakaoSearch();

  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [isDistanceMode, setIsDistanceMode] = useState(false);
  const [distancePoints, setDistancePoints] = useState<kakao.maps.LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // 수동(지도 찍어서) 경로
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeSelectPoints, setRouteSelectPoints] = useState<kakao.maps.LatLng[]>([]);
  const [routePath, setRoutePath] = useState<LL[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 연관 게시물
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  // 자동 3경로 + 맛집
  const [autoRoutePath, setAutoRoutePath] = useState<LL[]>([]);
  const [autoRouteInfo, setAutoRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [autoRouteEndpoints, setAutoRouteEndpoints] = useState<{ start?: LL; end?: LL } | null>(null);
  const [autoRouteLoading, setAutoRouteLoading] = useState(false);
  const [autoRouteError, setAutoRouteError] = useState<string | null>(null);

  // 더블클릭 추가 경로(출발지 → 선택 맛집) + 라벨용 정보
  const [extraPlacePath, setExtraPlacePath] = useState<LL[]>([]);
  const [extraPlaceTarget, setExtraPlaceTarget] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [extraPlaceETAsec, setExtraPlaceETAsec] = useState<number | null>(null);

  // ★ 더블클릭 시 해당 맛집만 마커 표시
  const [onlySelectedMarker, setOnlySelectedMarker] = useState(false);

  type RouteOption = {
    id: string;
    name: '빠른길' | '권장길' | '쉬운길';
    path: LL[];
    timeSec: number;
    distanceM: number;
    complexity: number;
  };
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  const {
    places: routePlaces,
    loading: routePlacesLoading,
    error: routePlacesError,
    search: searchAlongPath,
    reset: resetRoutePlaces,
  } = usePlacesAlongPath();

  const [placeCardOpen, setPlaceCardOpen] = useState(false);
  const [routeTargetPlace, setRouteTargetPlace] = useState<PlaceDetail | null>(null);

  /* 초기 검색 */
  useEffect(() => { (searchPlaces as any)('한밭대학교'); }, []); // eslint-disable-line

  /* 맵 이동 함수 */
  const panToPlace = useCallback((lat: number, lng: number, targetLevel: number | null = 3) => {
    if (!map) return;
    const pos = new kakao.maps.LatLng(lat, lng);
    if (targetLevel != null) {
      try {
        const cur = (map as any).getLevel?.() ?? null;
        if (cur == null || cur > targetLevel) (map as any).setLevel(targetLevel, { animate: true });
      } catch { (map as any).setLevel(targetLevel as number); }
    }
    (map as any).panTo(pos);
  }, [map]);

  /* Tmap 호출 */
  const callTmap = (body: { start: LL; end: LL; viaPoints?: LL[] }) =>
    fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
      return r.json();
    });

  /* 수동 경로 계산 */
  const runManualRoute = (sLL: kakao.maps.LatLng, eLL: kakao.maps.LatLng) => {
    setIsRouteMode(true);
    setRouteSelectPoints([sLL, eLL]);
    setRouteLoading(true);
    setRouteError(null);
    setRoutePath([]);
    setRouteInfo(null);

    callTmap({ start: { lat: sLL.getLat(), lng: sLL.getLng() }, end: { lat: eLL.getLat(), lng: eLL.getLng() } })
      .then((geojson) => {
        const features = geojson?.features ?? [];
        const lines = features.filter((f: any) => f?.geometry?.type === 'LineString');
        const coords: LL[] = lines.flatMap((f: any) =>
          (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
        );
        const sum = features.find((f: any) => f?.properties?.totalDistance || f?.properties?.totalTime)?.properties ?? {};
        setRoutePath(coords);
        setRouteInfo(sum ? { totalDistance: sum.totalDistance, totalTime: sum.totalTime } : null);
      })
      .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
      .finally(() => setRouteLoading(false));
  };

  /* 3경로 생성 */
  const handleRouteByCoords = useCallback(
    async (start: { lat: number; lng: number; name: string }, end: { lat: number; lng: number; name: string }) => {
      setAutoRouteLoading(true);
      setAutoRouteError(null);
      setAutoRoutePath([]);
      setAutoRouteInfo(null);
      setAutoRouteEndpoints({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
      resetRoutePlaces?.();
      setRouteOptions([]);
      setRouteTargetPlace({ name: '두 경로사이 맛집리스트', categoryText: '' } as PlaceDetail);
      setPlaceCardOpen(false);
      setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
      setOnlySelectedMarker(false); // 새 경로 시작 시 전체 모드로

      try {
        const geo0 = await callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
        const fs0 = geo0?.features ?? [];
        const ls0 = fs0.filter((f: any) => f?.geometry?.type === 'LineString');
        const path0: LL[] = ls0.flatMap((f: any) =>
          (f.geometry.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }))
        );
        if (path0.length < 2) throw new Error('경로 없음');

        const vias = makeOffsetVias(path0, 60);
        const calls: Array<Promise<any>> = [Promise.resolve(geo0)];
        if (vias.left)  calls.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng }, viaPoints: [vias.left] }));
        if (vias.right) calls.push(callTmap({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng }, viaPoints: [vias.right] }));

        const geos = await Promise.all(calls);

        const candidates: RouteOption[] = geos.map((geo: any, idx: number) => {
          const fs = geo?.features ?? [];
          const ls = fs.filter((f: any) => f?.geometry?.type === 'LineString');
          const path: LL[] = ls.flatMap((f: any) =>
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
          } as RouteOption;
        }).filter(c => c.path.length > 1);

        if (candidates.length === 0) throw new Error('대안 경로 생성 실패');

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
      } catch {
        setAutoRouteError('경로를 불러오지 못했습니다.');
      } finally {
        setAutoRouteLoading(false);
      }
    },
    [resetRoutePlaces]
  );

  /* === 개미행렬 설정 === */
  const DASH_LEN = 40;  // m
  const GAP_LEN  = 220;  // m
  const OVERLAP  = 40;   // m

  const [routePhase, setRoutePhase] = useState(0);
  const [autoPhase,  setAutoPhase]  = useState(0);

  // 지도 이동 중 여부 → 이동 중엔 개미행렬 숨김
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let raf = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!isMoving) {
        setRoutePhase(p => p + dt * 100);
        setAutoPhase (p => p + dt * 120);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isMoving]);

  useEffect(() => { setAutoPhase(0); }, [autoRoutePath, selectedRouteIdx]);
  useEffect(() => { setRoutePhase(0); }, [routePath]);

  const routeCum = useMemo(() => (routePath.length > 1 ? buildCumulativeDist(routePath) : [0]), [routePath]);
  const autoCum  = useMemo(() => (autoRoutePath.length > 1 ? buildCumulativeDist(autoRoutePath) : [0]), [autoRoutePath]);

  function makeAntSegments(
    path: LL[],
    cum: number[],
    phase: number,
    dashLen: number = DASH_LEN,
    gapLen: number  = GAP_LEN,
    overlap: number = OVERLAP,
    maxSeg: number  = 2000
  ): LL[][] {
    const total = cum[cum.length - 1] || 0;
    if (total <= 0 || path.length < 2) return [];
    const period = dashLen + gapLen;
    if (period <= 0) return [];
    const ph = ((phase % period) + period) % period;
    let s = ph - period;
    const endLimit = total + period;
    const need = Math.ceil((endLimit - s) / period) + 2;
    const budget = Math.min(maxSeg, need);
    const segs: LL[][] = [];
    for (let n = 0; n < budget && s < endLimit; n++, s += period) {
      const a = s - overlap;
      const b = s + dashLen + overlap;
      const seg = slicePathRange(path, cum, a, b);
      if (seg.length >= 2) segs.push(seg);
    }
  }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색
  const handleSearch = (start: string) => {
    if (start) searchPlaces(start);
    return segs;
  }

  const routeBorderSegs = useMemo(
    () => makeAntSegments(routePath, routeCum, routePhase, DASH_LEN, GAP_LEN, OVERLAP),
    [routePath, routeCum, routePhase]
  );
  const autoBorderSegs = useMemo(
    () => makeAntSegments(autoRoutePath, autoCum, autoPhase, DASH_LEN, GAP_LEN, OVERLAP),
    [autoRoutePath, autoCum, autoPhase]
  );

  /* 음식 탭/필터 */
  const FOOD_TABS = ['전체','한식','중식','일식','피자','패스트푸드','치킨','분식','카페','족발/보쌈','기타'] as const;
  type FoodTab = typeof FOOD_TABS[number];
  const [foodTab, setFoodTab] = useState<FoodTab>('전체');

  // 공백/구분자 제거 본문까지 함께 매칭하는 정규화 헬퍼
  const normalize = (s: string) => s.toLowerCase().replace(/[\s>/·ㆍ,|-]+/g, '');

  const classifyPlace = (p: any): FoodTab => {
    const group = ((p?.category_group_code || p?.categoryGroupCode || p?.group) || '').toUpperCase();
    const name = (p?.name || p?.place_name || '').toLowerCase();
    const cat  = (p?.category_name || '').toLowerCase();

    // 일반 텍스트 + 공백/구분자 제거 텍스트 모두에서 매칭 시도
    const text   = `${name} ${cat}`;
    const textNS = normalize(name) + normalize(cat);

    const has = (words: string[]) =>
      words.some((w) => {
        const lw = w.toLowerCase();
        return text.includes(lw) || textNS.includes(normalize(lw));
      });

    // 그룹 코드 우선
    if (group === 'CE7') return '카페';

    // ✅ '족발/보쌈'은 한식보다 먼저 체크 (브랜드/일반 키워드 모두 포함)
    if (has([
      '족발','왕족발','족발보쌈','보쌈','보쌈정식','마늘보쌈','수육',
      '가장맛있는족발','가장 맛있는 족발','원할머니보쌈','장충동왕족발','족발야시장','미쓰족발','삼대족발'
    ])) return '족발/보쌈';

    if (has(['피자','pizza','도미노','파파존스','피자헛'])) return '피자';
    if (has(['맥도날드','버거킹','롯데리아','kfc','서브웨이','버거'])) return '패스트푸드';
    if (has(['치킨','bbq','교촌','bhc','푸라닭','네네','굽네'])) return '치킨';
    if (has(['분식','떡볶이','김밥','라볶이','순대','핫도그'])) return '분식';
    if (has(['중식','짜장','짬뽕','탕수육','마라'])) return '중식';
    if (has(['일식','스시','초밥','라멘','돈카츠','우동'])) return '일식';

    // ⬇️ 한식에서는 족발/보쌈 계열 제외(위에서 이미 걸러짐)
    if (has(['한식','국밥','백반','비빔밥','설렁탕','갈비','냉면','칼국수','삼겹살','곱창','감자탕'])) return '한식';

    return '기타';
  };

  const filteredRoutePlaces = useMemo(() => {
    const list = Array.isArray(routePlaces) ? routePlaces : [];
    if (foodTab === '전체') return list;

    return list.filter((p: any) => {
      const group = (p?.category_group_code || p?.group || '').toUpperCase();

    if (place?.place_name) {
      setSelectedPlaceName(place.place_name);
    } 
  };

  // 게시글 열기(라우트 이동 전 상태 저장)
  // const handleOpenPost = useCallback((boardNumber: string | number) => {
  //   if (boardNumber === undefined || boardNumber === null) return;
  //   saveBeforeGoDetail();
  //   navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`, {
  //     state: {
  //       from: location.pathname,
  //       fromMap: true,
  //       fromSearch: selectedPlace?.place_name ?? null,
  //     },
  //   });
  // }, [navigate, location.pathname, selectedPlace, saveBeforeGoDetail]);
      // ‘카페’는 그룹 코드 CE7 우선
      if (foodTab === '카페') return group === 'CE7' || classifyPlace(p) === '카페';

      const cls = classifyPlace(p);

      // ‘족발/보쌈’ 탭일 땐 안전망(정규식)으로 한 번 더 포함시도
      if (foodTab === '족발/보쌈') {
        const txt = `${p?.name || p?.place_name || ''} ${p?.category_name || ''}`.toLowerCase();
        if (/(족발|보쌈)/.test(txt)) return true;
      }

      return cls === foodTab;
    });
  }, [routePlaces, foodTab]);

  /* ✅ ‘족발/보쌈’ 탭일 때만 키워드/반경 보강 */
  const JOKBAL_KEYWORDS = [
    '족발','보쌈','왕족발','족발보쌈','보쌈정식','마늘보쌈','수육',
    '가장맛있는족발','원할머니보쌈','장충동왕족발','족발야시장','미쓰족발','삼대족발'
  ];

  const optsForTab = (tab: FoodTab) => {
    if (tab === '족발/보쌈') {
      return {
        stepMeters: 120,
        radius: 450,
        includeCafe: false,
        categoryGroupCodes: ['FD6'],
        keywords: JOKBAL_KEYWORDS,
        limit: 250,
      };
    }
    // 기본(다른 탭)은 기존 기본값과 유사
    return {
      stepMeters: 150,
      radius: 350,
      includeCafe: true,
      limit: 200,
    };
  };

  /* 경로 선택 시: 맛집 로딩 후 카드 */
  const selectRoute = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    setSelectedRouteIdx(i);
    setAutoRoutePath(routeOptions[i].path);
    setAutoRouteInfo({ totalDistance: routeOptions[i].distanceM, totalTime: routeOptions[i].timeSec });
    setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
    setOnlySelectedMarker(false); // 경로 재선택 시 전체 모드
    resetRoutePlaces?.();

    setPlaceCardOpen(true);                 // ✅ 카드 먼저 열기 → 바로 '로딩 중' 보임
    // ✅ 탭별 옵션 주입 (특히 '족발/보쌈'일 때 키워드/반경 보강)
    searchAlongPath(routeOptions[i].path, optsForTab(foodTab));
  }, [routeOptions, resetRoutePlaces, searchAlongPath, foodTab]);

  const openRouteDetail = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    const r = routeOptions[i];
    setSelectedRouteIdx(i);
    setAutoRoutePath(r.path);
    setAutoRouteInfo({ totalDistance: r.distanceM, totalTime: r.timeSec });
    setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
    setOnlySelectedMarker(false);

    setPlaceCardOpen(true);                 // ✅ 먼저 열기
    searchAlongPath(r.path, optsForTab(foodTab)); // ✅ 탭별 옵션 주입
  }, [routeOptions, searchAlongPath, foodTab]);

  const onFocusOrDoubleToRoute = useCallback(
  async (p: { lat: number|string; lng: number|string; name?: string; place_name?: string }) => {
    const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
    const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // 지도로 부드럽게 이동
    panToPlace(lat, lng, 3);

    const start = autoRouteEndpoints?.start;
    if (!start) return;

    try {
      // 출발지 → 선택한 맛집까지 보행자 경로 조회
      const geo = await callTmap({ start, end: { lat, lng } });
      const fs  = geo?.features ?? [];
      const ls  = fs.filter((f: any) => f?.geometry?.type === 'LineString');
      const coords = ls.flatMap((f: any) =>
        (f.geometry.coordinates ?? []).map(([lng2, lat2]: [number, number]) => ({ lat: lat2, lng: lng2 }))
      );

      const sum = fs.find((f: any) => f?.properties?.totalTime || f?.properties?.totalDistance)?.properties ?? {};
      const etaSec =
        typeof sum.totalTime === 'number' ? sum.totalTime :
        (typeof sum.time === 'number' ? sum.time : null);

      setExtraPlacePath(coords);
      setExtraPlaceTarget({ lat, lng, name: (p?.name || p?.place_name || '목적지') as string });
      setExtraPlaceETAsec(etaSec);

      // 선택 가게만 마커 표시
      setOnlySelectedMarker(true);
    } catch {
      // 실패해도 UI 깨지지 않게 조용히 무시
    }
  },
  [autoRouteEndpoints?.start, panToPlace]
);
  /* 지도 클릭 */
  const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    const clickedLatLng = mouseEvent.latLng;
    if (isDistanceMode) {
      const next = [...distancePoints, clickedLatLng];
      if (next.length <= 2) {
        setDistancePoints(next);
        if (next.length === 2) {
          const [p1, p2] = next;
          const km = haversine({ lat: p1.getLat(), lng: p1.getLng() }, { lat: p2.getLat(), lng: p2.getLng() }) / 1000;
          setDistanceKm(km);
        } else setDistanceKm(null);
      } else { setDistancePoints([clickedLatLng]); setDistanceKm(null); }
      return;
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
        runManualRoute(new kakao.maps.LatLng(s.getLat(), s.getLng()), new kakao.maps.LatLng(e.getLat(), e.getLng()));
        return;
      }
      setRouteSelectPoints([clickedLatLng]);
      setRoutePath([]); setRouteInfo(null); setRouteError(null);
    }
  };

  const formatDistance = (km: number) => (km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`);
  const formatMeters = (m?: number) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(2)} km`);
  const formatMinutes = (sec?: number) => (sec == null ? '' : `${Math.round(sec / 60)} min`);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const rightBase = 10;

  return (
    <div className='main-wrapper'>
      <SearchSidebar
        searchResults={searchResults}
        onClickItem={(place: any) => {
          const lat = Number(place?.y); const lng = Number(place?.x);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) { setSelectedIndex((searchResults as any).indexOf(place)); panToPlace(lat, lng, 3); }
        }}
        selectedIndex={selectedIndex}
        isOpen={isSidebarOpen}
        toggleOpen={() => setIsSidebarOpen(prev => !prev)}
        onSearch={(kw: string) => kw && (searchPlaces as any)(kw)}
        onRouteByCoords={handleRouteByCoords}
        routePlaces={filteredRoutePlaces as any}
        routeLoading={routePlacesLoading}
        routeError={routePlacesError ?? null}
        onFocusRoutePlace={() => {}}
        routeOptions={routeOptions}
        selectedRouteIdx={selectedRouteIdx}
        onSelectRoute={selectRoute}
        onOpenRouteDetail={openRouteDetail}
        showRoutePlacesInSidebar={false}
      />

      {routeTargetPlace && placeCardOpen && (
        <PlaceDetailCard
          open
          place={routeTargetPlace}
          onClose={() => { setPlaceCardOpen(false); }}
          leftSidebarWidth={isSidebarOpen ? 340 : 16}
          gap={16}
          topOffset={64}
          width={520}
        >
          <div className="pd-tabs">
            {FOOD_TABS.map(t => (
              <button
                key={t}
                className={`pd-tab ${foodTab === t ? 'active' : ''}`}
                onClick={() => { setFoodTab(t as any); setOnlySelectedMarker(false); }} // ★ 탭 클릭 시 전체 마커 모드 복귀
              >
                {t}
              </button>
            ))}
          </div>

          {routePlacesLoading ? (
            <div style={{ padding: 12, fontWeight: 700 }}>로딩 중입니다…</div>
          ) : (
            <>
              <div className="pd-list-summary">
                경로 주변 맛집 <b>총 {Array.isArray(filteredRoutePlaces) ? filteredRoutePlaces.length : 0}곳</b>
              </div>
              <PlaceList
                places={filteredRoutePlaces as any}
                isLoading={routePlacesLoading}
                hiddenWhileLoading
                onItemDoubleClick={(p) => onFocusOrDoubleToRoute(p)}
              />
              {extraPlaceTarget && extraPlacePath.length > 1 && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  추가 경로 표시 중: <b>{extraPlaceTarget.name}</b>
                  {typeof extraPlaceETAsec === 'number' && <> · 예상 {Math.round(extraPlaceETAsec / 60)} min</>}
                </div>
              )}
            </>
          )}
        </PlaceDetailCard>
      )}

      {isDistanceMode && distanceKm !== null && (
        <div className="distance-overlay">
          선택된 두 지점 사이의 직선 거리는 약 {(distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(2)} km`)} 입니다.
        </div>
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

      <Map
        center={center}
        style={{ width: '100%', height: '100vh' }}
        level={4}
        onClick={handleMapClick}
        onCreate={(m) => {
          setMap(m);
          try { (m as any).setZoomable?.(true); } catch {}
          kakao.maps.event.addListener(m, 'dragstart', () => setIsMoving(true));
          kakao.maps.event.addListener(m, 'drag',      () => setIsMoving(true));
          kakao.maps.event.addListener(m, 'zoom_start', () => setIsMoving(true));
          kakao.maps.event.addListener(m, 'center_changed', () => setIsMoving(true));
          kakao.maps.event.addListener(m, 'idle', () => {
            setIsMoving(false);
            setRoutePhase(0);
            setAutoPhase(0);
          });
          kakao.maps.event.addListener(m, 'zoom_changed', () => {
            setIsMoving(false);
            setRoutePhase(0);
            setAutoPhase(0);
          });
        }}
        className="map"
      >
        <MapTypeControl position="TOPRIGHT" />
        <ZoomControl position="RIGHT" />

        {/* 검색 마커 */}
        {searchResults.map((place, index) => (
          <MapMarker
            key={`search-${index}`}
            position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
            onClick={() => {
              const lat = Number(place?.y); const lng = Number(place?.x);
              if (!Number.isNaN(lat) && !Number.isNaN(lng)) { setSelectedIndex(index); panToPlace(lat, lng, 3); }
            }}
            clickable
          >
            {selectedIndex === index && <div className="marker-info"><strong>{place.place_name}</strong></div>}
          </MapMarker>
        ))}

        {/* 수동 경로 포인트 */}
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

        {/* 수동 경로: 보라(아래) + 흰 개미행렬(위) */}
        {isRouteMode && routePath.length > 1 && (
          <>
            <Polyline
              path={routePath}
              strokeWeight={8}
              strokeColor={'#8a2ea1ff'}
              strokeOpacity={0.98}
              strokeStyle={'solid'}
              zIndex={70}
            />
            {!isMoving && routeBorderSegs.map((seg, i) => (
              <Polyline
                key={`rborder-${i}`}
                path={seg}
                strokeWeight={6}
                strokeColor={'#FFFFFF'}
                strokeOpacity={0.98}
                strokeStyle={'solid'}
                zIndex={80}
              />
            ))}
          </>
        )}

        {/* 자동 3경로: 비선택 경로 */}
        {routeOptions.map((r, i) => {
          const selected = i === selectedRouteIdx;
          if (selected) return null;
          return (
            <Polyline
              key={`opt-${r.id}`}
              path={r.path}
              strokeWeight={4}
              strokeColor={'#8a8a8a'}
              strokeOpacity={0.5}
              strokeStyle={'dash'}
              zIndex={30}
            />
          );
        })}

        {/* 자동 선택 경로: 보라(아래) + 흰 개미행렬(위) */}
        {autoRoutePath.length > 1 && (
          <>
            <Polyline
              path={autoRoutePath}
              strokeWeight={8}
              strokeColor={'#8a2ea1ff'}
              strokeOpacity={0.98}
              strokeStyle={'solid'}
              zIndex={75}
            />
            {!isMoving && autoBorderSegs.map((seg, i) => (
              <Polyline
                key={`aborder-${i}`}
                path={seg}
                strokeWeight={6}
                strokeColor={'#FFFFFF'}
                strokeOpacity={0.98}
                strokeStyle={'solid'}
                zIndex={85}
              />
            ))}
          </>
        )}

        {/* 추가 경로(파란색) */}
        {extraPlacePath.length > 1 && (
          <Polyline
            path={extraPlacePath}
            strokeWeight={6}
            strokeColor={'#2E86DE'}
            strokeOpacity={0.95}
            strokeStyle={'solid'}
            zIndex={78}
          />
        )}

        {/* ★ 단일 마커 모드일 때: 선택 맛집만 마커/라벨 */}
        {onlySelectedMarker && extraPlaceTarget && (
          <>
            <MapMarker position={{ lat: extraPlaceTarget.lat, lng: extraPlaceTarget.lng }} />
            <CustomOverlayMap position={{ lat: extraPlaceTarget.lat, lng: extraPlaceTarget.lng }} yAnchor={1.25} zIndex={95}>
              <div className="km-label">
                {extraPlaceTarget.name}
                {typeof extraPlaceETAsec === 'number' && <> · {Math.round(extraPlaceETAsec / 60)} min</>}
              </div>
            </CustomOverlayMap>
          </>
        )}

        {/* 일반(탭) 모드일 때: 필터된 모든 맛집 마커 */}
        {!onlySelectedMarker && Array.isArray(filteredRoutePlaces) && filteredRoutePlaces.map((p: any, idx: number) => {
          const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
          const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const key = (p?.id ?? `${lat},${lng}`) + '-' + idx;
          return (
            <React.Fragment key={`routeplace-${key}`}>
              <MapMarker position={{ lat, lng }} />
            </React.Fragment>
          );
        })}
      </Map>
      <MenuButton/>
    </div>
  );
}
