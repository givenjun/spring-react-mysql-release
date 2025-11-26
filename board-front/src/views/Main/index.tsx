// board-front/src/views/Main/index.tsx
import React, {
  useEffect, useMemo, useState, useCallback, useRef, useDeferredValue,
} from 'react';
import {
  Map,
  MapMarker,
  MapTypeControl,
  Polyline,
  ZoomControl,
  CustomOverlayMap,
} from 'react-kakao-maps-sdk';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hook';
import PlaceDetailCard, { PlaceDetail } from 'components/Map/PlaceDetailCard';
import usePlacesAlongPath from 'hooks/Map/usePlacesAlongPath';
import PlaceList from 'components/Map/PlaceList';
import './style.css';
import 'components/Map/marker-label.css';
import MenuButton from 'components/Menu/MenuButton';
import useRelativeStore from 'stores/relativeStore';

// ✅ 카테고리별 PNG 마커 컴포넌트
import CategoryMarker from 'components/Map/CategoryMarker';

// ✅ SK Tmap 경로 API (시간/거리 포함) 사용
import { getPedestrianRoute } from 'apis/tmap';

// ✅ 거리 정렬 유틸
import { sortPlacesByDistance } from 'utils';

// ✅ 카카오맵 미니 뷰어
import PlaceMiniViewer from 'components/Map/PlaceMiniViewer';

// ⚠️ requestIdleCallback는 재선언하지 않습니다
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
  let lo = 0; let hi = cum.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cum[mid] < s) lo = mid + 1; else hi = mid;
  }
  const i = Math.max(1, lo);
  const s0 = cum[i - 1]; const s1 = cum[i];
  const t = (s - s0) / (s1 - s0);
  const P = path[i - 1]; const Q = path[i];
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
  const end = interpolateAt(path, cum, b);
  const seg: LL[] = [start];
  for (let i = 1; i < path.length; i++) if (cum[i] > a && cum[i] < b) seg.push(path[i]);
  seg.push(end);
  return seg;
}
function bearing(a: LL, b: LL) {
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

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
  const a = basePath[i]; const b = basePath[i + 1];
  const az = bearing(a, b);
  const mid: LL = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  return {
    left: offsetByMeters(mid, az, d, 'left'),
    right: offsetByMeters(mid, az, d, 'right'),
  };
}

// ✅ 여러 개의 우회 후보(viaPoints 세트) 생성 – 오프셋 거리만 다르게
function buildViaCandidates(basePath: LL[]): LL[][] {
  const result: LL[][] = [];
  const offsets = [80, 150, 250];

  for (const d of offsets) {
    const vias = makeOffsetVias(basePath, d);
    if (vias.left) result.push([vias.left]);
    if (vias.right) result.push([vias.right]);
  }

  return result;
}

/** 🔥 경로 모양을 정규화해서 "같은 길인지" 비교하기 위한 시그니처 */
function routeSignature(path: LL[]): string {
  if (!path || path.length === 0) return 'empty';
  const cum = buildCumulativeDist(path);
  const total = cum[cum.length - 1] || 0;
  if (total === 0) {
    const p = path[0];
    const lat = Math.round(p.lat * 1e4);
    const lng = Math.round(p.lng * 1e4);
    return `point:${lat},${lng}`;
  }
  const parts: string[] = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const s = (total * i) / N;
    const p = interpolateAt(path, cum, s);
    const lat = Math.round(p.lat * 1e4);
    const lng = Math.round(p.lng * 1e4);
    parts.push(`${lat},${lng}`);
  }
  return parts.join('|');
}

function complexityScore(path: LL[]): number {
  if (!path || path.length < 3) return 0;
  let turnSum = 0; let zigzag = 0; let shortSeg = 0; let totalLen = 0; let prevSign = 0;
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
  const [mapMode, setMapMode] = useState<'explore' | 'route'>('explore');

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

  // 자동 3경로 + 맛집
  const [autoRoutePath, setAutoRoutePath] = useState<LL[]>([]);
  const [autoRouteInfo, setAutoRouteInfo] = useState<{ totalDistance?: number; totalTime?: number } | null>(null);
  const [autoRouteEndpoints, setAutoRouteEndpoints] = useState<{ start?: LL; end?: LL } | null>(null);
  const [autoRouteLoading, setAutoRouteLoading] = useState(false);
  const [autoRouteError, setAutoRouteError] = useState<string | null>(null);

  type DistanceBase = 'origin' | 'destination' | null;
  const [distanceBase, setDistanceBase] = useState<DistanceBase>(null);

  // 🔥 경로 위에서 사용자가 찍은 기준 지점 (출발/도착 대신 이걸 기준으로 정렬)
  const [routePivot, setRoutePivot] = useState<LL | null>(null);
  // 🔥 "경로에서 클릭 지점 기준 정렬" 모드 ON/OFF
  const [isPivotSelectMode, setIsPivotSelectMode] = useState(false);

  // 더블클릭 추가 경로(출발지 or pivot → 선택 맛집) + 라벨용 정보
  const [extraPlacePath, setExtraPlacePath] = useState<LL[]>([]);
  const [extraPlaceTarget, setExtraPlaceTarget] = useState<{ lat: number; lng: number; name: string; category?: string } | null>(null);
  const [extraPlaceETAsec, setExtraPlaceETAsec] = useState<number | null>(null);

  const [onlySelectedMarker, setOnlySelectedMarker] = useState(false);
  const [hasUserSearched, setHasUserSearched] = useState(false);

  // 🔥 미니뷰어에 넘길 데이터
  const [miniViewerPlace, setMiniViewerPlace] = useState<{
    name: string;
    lat: number;
    lng: number;
    placeUrl?: string;
  } | null>(null);

  type RouteOption = {
    id: string;
    name: '빠른길' | '권장길' | '쉬운길';
    path: LL[];
    timeSec: number;
    distanceM: number;
    complexity: number;
  };
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);

  const {
    places: routePlaces,
    loading: routePlacesLoading,
    error: routePlacesError,
    search: searchAlongPath,
    reset: resetRoutePlaces,
  } = usePlacesAlongPath();

  const [placeCardOpen, setPlaceCardOpen] = useState(false);
  const [routeTargetPlace, setRouteTargetPlace] = useState<PlaceDetail | null>(null);

  // 🔥 초기 진입 시 기본 장소 검색 (초기 리스트)
  useEffect(() => { (searchPlaces as any)('한밭대학교'); }, []); // eslint-disable-line

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

  const runManualRoute = (sLL: kakao.maps.LatLng, eLL: kakao.maps.LatLng) => {
    setIsRouteMode(true);
    setRouteSelectPoints([sLL, eLL]);
    setRouteLoading(true);
    setRouteError(null);
    setRoutePath([]);
    setRouteInfo(null);
    setRoutePivot(null);
    setIsPivotSelectMode(false);

    const req = {
      start: { lat: sLL.getLat(), lng: sLL.getLng() },
      end: { lat: eLL.getLat(), lng: eLL.getLng() },
    };

    getPedestrianRoute(req)
      .then((route) => {
        setRoutePath(route.path || []);
        setRouteInfo({
          totalDistance: route.totalDistance,
          totalTime: route.totalTime,
        });
      })
      .catch(() => setRouteError('경로를 불러오지 못했습니다.'))
      .finally(() => setRouteLoading(false));
  };

  const routeQueryVerRef = useRef(0);

  const handleRouteByCoords = useCallback(
    async (start: { lat: number; lng: number; name: string }, end: { lat: number; lng: number; name: string }) => {
      // 🔥 마커 로딩 중에는 새로운 경로 보기를 막음
      if (routePlacesLoading) return;

      setMapMode('route');
      setAutoRouteLoading(true);
      setAutoRouteError(null);
      setAutoRoutePath([]);
      setAutoRouteInfo(null);
      setAutoRouteEndpoints({ start: { lat: start.lat, lng: start.lng }, end: { lat: end.lat, lng: end.lng } });
      resetRoutePlaces?.();
      routeQueryVerRef.current++;
      setRouteOptions([]);
      setRouteTargetPlace({ name: '두 경로사이 맛집리스트', categoryText: '' } as PlaceDetail);
      setPlaceCardOpen(false);
      setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
      setOnlySelectedMarker(false);
      setDistanceBase(null);
      setMiniViewerPlace(null);
      setRoutePivot(null);
      setIsPivotSelectMode(false);

      try {
        const baseReq = {
          start: { lat: start.lat, lng: start.lng },
          end: { lat: end.lat, lng: end.lng },
        };

        const baseRoute = await getPedestrianRoute(baseReq);
        const basePath = baseRoute.path || [];
        const baseTimeSec = Number(baseRoute.totalTime ?? 0);
        const baseDistM = Number(baseRoute.totalDistance ?? 0);

        if (basePath.length < 2) throw new Error('경로 없음');

        const viaCandidates = buildViaCandidates(basePath);
        const limitedViaCandidates = viaCandidates.slice(0, 6);

        const viaPromises = limitedViaCandidates.map((vias) =>
          getPedestrianRoute({
            ...baseReq,
            viaPoints: vias as any,
          }).then((route) => ({ route, vias }))
            .catch(() => null),
        );

        const viaResultsRaw = await Promise.all(viaPromises);
        const viaResults = viaResultsRaw.filter((v): v is { route: any; vias: LL[] } => !!v);

        let allCandidates: RouteOption[] = [];

        const baseComplexity = complexityScore(basePath);
        allCandidates.push({
          id: 'base',
          name: '권장길',
          path: basePath,
          timeSec: Math.round(baseTimeSec),
          distanceM: Math.round(baseDistM),
          complexity: baseComplexity,
        });

        for (const { route } of viaResults) {
          const path = route.path || [];
          if (!path || path.length < 2) continue;
          const t = Number(route.totalTime ?? 0);
          const d = Number(route.totalDistance ?? 0);

          allCandidates.push({
            id: `via-${Math.random().toString(36).slice(2, 8)}`,
            name: '권장길',
            path,
            timeSec: Math.round(t),
            distanceM: Math.round(d),
            complexity: complexityScore(path),
          });
        }

        const sigMap: Record<string, RouteOption> = {};
        for (const cand of allCandidates) {
          const sig = routeSignature(cand.path);
          const prev = sigMap[sig];
          if (!prev || cand.timeSec < prev.timeSec) sigMap[sig] = cand;
        }
        allCandidates = Object.values(sigMap);

        const MAX_COMPLEXITY_FACTOR = 1.8;
        const MAX_COMPLEXITY_ABS = 10;
        const MAX_DIST_FACTOR = 1.6;

        let candidates = allCandidates.filter((c, idx) => {
          if (idx === 0) return true;

          if (!Number.isFinite(c.complexity)) return false;
          if (baseComplexity > 0 && c.complexity > MAX_COMPLEXITY_FACTOR * baseComplexity) return false;
          if (c.complexity > MAX_COMPLEXITY_ABS) return false;

          if (baseDistM > 0 && c.distanceM > baseDistM * MAX_DIST_FACTOR) return false;

          return true;
        });

        if (candidates.length < 2) {
          candidates = allCandidates;
        }

        const usable = candidates.length > 0 ? candidates : [allCandidates[0]];
        if (usable.length === 0) throw new Error('대안 경로 생성 실패');

        const timesAll = usable.map((c) => c.timeSec);
        const fastestTime = Math.min(...timesAll);
        const idxFast = timesAll.indexOf(fastestTime);
        const fastRoute = usable[idxFast];

        const MIN_EXTRA_RECOMMEND = 180;
        const MAX_EXTRA_RECOMMEND = 600;
        const TARGET_EXTRA_RECOMMEND = 240;

        const recommendCandidates = usable.filter((c, idx) => {
          if (idx === idxFast) return false;
          const extra = c.timeSec - fastestTime;
          return extra >= MIN_EXTRA_RECOMMEND && extra <= MAX_EXTRA_RECOMMEND;
        });

        let recommendRoute: RouteOption | null = null;
        if (recommendCandidates.length > 0) {
          let bestScore = Infinity;
          for (const c of recommendCandidates) {
            const extra = c.timeSec - fastestTime;
            const diffToTarget = Math.abs(extra - TARGET_EXTRA_RECOMMEND);
            const score = diffToTarget + 30 * c.complexity;
            if (score < bestScore) {
              bestScore = score;
              recommendRoute = c;
            }
          }
        }

        const MIN_EXTRA_EASY = 120;
        const MAX_EXTRA_EASY = 900;

        const easyCandidates = usable.filter((c) => {
          if (c.id === fastRoute.id) return false;
          if (recommendRoute && c.id === recommendRoute.id) return false;
          const extra = c.timeSec - fastestTime;
          return extra >= MIN_EXTRA_EASY && extra <= MAX_EXTRA_EASY;
        });

        let easyRoute: RouteOption | null = null;
        if (easyCandidates.length > 0) {
          let bestComplexity = Infinity;
          for (const c of easyCandidates) {
            if (c.complexity < bestComplexity) {
              bestComplexity = c.complexity;
              easyRoute = c;
            }
          }
        }

        const finalRoutes: RouteOption[] = [];

        if (fastRoute) finalRoutes.push({ ...fastRoute, name: '빠른길' });

        if (recommendRoute && recommendRoute.id !== fastRoute.id) {
          finalRoutes.push({ ...recommendRoute, name: '권장길' });
        }

        if (
          easyRoute &&
          easyRoute.id !== fastRoute.id &&
          (!recommendRoute || easyRoute.id !== recommendRoute.id)
        ) {
          finalRoutes.push({ ...easyRoute, name: '쉬운길' });
        }

        if (finalRoutes.length === 0) {
          finalRoutes.push({ ...fastRoute, name: '빠른길' });
        }

         const trimmed = finalRoutes.slice(0, 3);
        const ord = { 빠른길: 0, 권장길: 1, 쉬운길: 2 } as const;
        trimmed.sort((a, b) => ord[a.name] - ord[b.name]);

        setRouteOptions(trimmed);

        // ✅ 기본 선택 없음: 사용자가 카드 클릭할 때까지는 "선택" 표시 X
        setSelectedRouteIdx(null);

        // 여전히 지도에는 기본으로 빠른길(0번)을 그려줌
        setAutoRoutePath(trimmed[0].path);
        setAutoRouteInfo({
          totalDistance: trimmed[0].distanceM,
          totalTime: trimmed[0].timeSec,
        });
      } catch {
        setAutoRouteError('경로를 불러오지 못했습니다.');
      } finally {
        setAutoRouteLoading(false);
      }
    },
    [resetRoutePlaces, routePlacesLoading],
  );

  const DASH_LEN = 40;
  const GAP_LEN = 220;
  const OVERLAP = 40;

  const [routePhase, setRoutePhase] = useState(0);
  const [autoPhase, setAutoPhase] = useState(0);

  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let raf = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!isMoving) {
        setRoutePhase((p) => p + dt * 100);
        setAutoPhase((p) => p + dt * 120);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isMoving]);

  useEffect(() => { setAutoPhase(0); }, [autoRoutePath, selectedRouteIdx]);
  useEffect(() => { setRoutePhase(0); }, [routePath]);

  const routeCum = useMemo(() => (routePath.length > 1 ? buildCumulativeDist(routePath) : [0]), [routePath]);
  const autoCum = useMemo(() => (autoRoutePath.length > 1 ? buildCumulativeDist(autoRoutePath) : [0]), [autoRoutePath]);

  function makeAntSegments(
    path: LL[],
    cum: number[],
    phase: number,
    dashLen: number = DASH_LEN,
    gapLen: number = GAP_LEN,
    overlap: number = OVERLAP,
    maxSeg: number = 2000,
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
    return segs;
  }

  const routeBorderSegs = useMemo(
    () => makeAntSegments(routePath, routeCum, routePhase, DASH_LEN, GAP_LEN, OVERLAP),
    [routePath, routeCum, routePhase],
  );
  const autoBorderSegs = useMemo(
    () => makeAntSegments(autoRoutePath, autoCum, autoPhase, DASH_LEN, GAP_LEN, OVERLAP),
    [autoRoutePath, autoCum, autoPhase],
  );

  const FOOD_TABS = ['전체', '한식', '중식', '일식', '피자', '패스트푸드', '치킨', '분식', '카페', '족발/보쌈', '기타'] as const;
  type FoodTab = typeof FOOD_TABS[number];
  const [foodTab, setFoodTab] = useState<FoodTab>('전체');

  const normalize = (s: string) => s.toLowerCase().replace(/[\s>/·ㆍ,|-]+/g, '');

  const classifyPlace = (p: any): FoodTab => {
    const group = ((p?.category_group_code || p?.categoryGroupCode || p?.group) || '').toUpperCase();
    const name = (p?.name || p?.place_name || '').toLowerCase();
    const cat = (p?.category_name || '').toLowerCase();

    const text = `${name} ${cat}`;
    const textNS = normalize(name) + normalize(cat);

    const has = (words: string[]) =>
      words.some((w) => {
        const lw = w.toLowerCase();
        return text.includes(lw) || textNS.includes(normalize(lw));
      });

    if (group === 'CE7') return '카페';

    if (has([
      '족발', '왕족발', '족발보쌈', '보쌈정식', '마늘보쌈', '수육',
      '가장맛있는족발', '가장 맛있는 족발', '원할머니보쌈', '장충동왕족발', '족발야시장', '미쓰족발', '삼대족발',
    ])) return '족발/보쌈';

    if (has(['피자', 'pizza', '도미노', '파파존스', '피자헛'])) return '피자';
    if (has(['맥도날드', '버거킹', '롯데리아', 'kfc', '서브웨이', '버거'])) return '패스트푸드';
    if (has(['치킨', 'bbq', '교촌', 'bhc', '푸라닭', '네네', '굽네'])) return '치킨';
    if (has(['분식', '떡볶이', '김밥', '라볶이', '순대', '핫도그'])) return '분식';
    if (has(['중식', '짜장', '짬뽕', '탕수육', '마라'])) return '중식';
    if (has(['일식', '스시', '초밥', '라멘', '돈카츠', '우동'])) return '일식';

    if (has(['한식', '국밥', '백반', '비빔밥', '설렁탕', '갈비', '냉면', '칼국수', '삼겹살', '곱창', '감자탕'])) return '한식';

    return '기타';
  };

  const filteredRoutePlaces = useMemo(() => {
    const list = Array.isArray(routePlaces) ? routePlaces : [];
    if (foodTab === '전체') return list;

    return list.filter((p: any) => {
      const group = (p?.category_group_code || p?.group || '').toUpperCase();

      if (foodTab === '카페') return group === 'CE7' || classifyPlace(p) === '카페';

      const cls = classifyPlace(p);

      if (foodTab === '족발/보쌈') {
        const txt = `${p?.name || p?.place_name || ''} ${p?.category_name || ''}`.toLowerCase();
        if (/(족발|보쌈)/.test(txt)) return true;
      }

      return cls === foodTab;
    });
  }, [routePlaces, foodTab]);

  const deferredFiltered = useDeferredValue(filteredRoutePlaces);

  const [markerItems, setMarkerItems] = useState<any[]>([]);
  useEffect(() => {
    const list = Array.isArray(filteredRoutePlaces) ? filteredRoutePlaces : [];
    let cancelled = false;
    let i = 0;
    const CHUNK = 60;
    setMarkerItems([]);

    const pump = () => {
      if (cancelled) return;
      const next = list.slice(i, i + CHUNK);
      if (next.length) setMarkerItems((prev) => prev.concat(next));
      i += CHUNK;
      if (i < list.length) {
        const rIC = (typeof window !== 'undefined' && 'requestIdleCallback' in window)
          ? (window as any).requestIdleCallback as (cb: () => void, opts?: { timeout?: number }) => number
          : undefined;
        if (rIC) rIC(pump, { timeout: 120 });
        else setTimeout(pump, 16);
      }
    };

    pump();
    return () => { cancelled = true; };
  }, [filteredRoutePlaces]);

  const JOKBAL_KEYWORDS = [
    '족발', '보쌈', '왕족발', '족발보쌈', '보쌈정식', '마늘보쌈', '수육',
    '가장맛있는족발', '원할머니보쌈', '장충동왕족발', '족발야시장', '미쓰족발', '삼대족발',
  ];

  const makeAdaptiveStep = (path?: LL[]) => {
    if (!path || path.length < 2) return 150;
    const cum = buildCumulativeDist(path);
    return Math.max(100, Math.min(300, Math.round((cum[cum.length - 1] || 0) / 400)));
  };

  const pathKm = (p?: LL[]) => {
    if (!p || p.length < 2) return 0;
    const cum = buildCumulativeDist(p);
    return (cum[cum.length - 1] || 0) / 1000;
  };

  const calcBudget = (path?: LL[]) => {
    const km = pathKm(path);
    return Math.min(1200, Math.max(400, Math.round(120 + 60 * km)));
  };

  const optsForTab = (tab: typeof FOOD_TABS[number], path?: LL[]) => {
    const km = pathKm(path);
    const adaptiveStep = makeAdaptiveStep(path);
    const useFull = km >= 5;
    const budget = calcBudget(path);
    const timeBudgetMs = useFull
      ? Math.min(9000, 3500 + Math.round(400 * km))
      : 2000;

    const modeVal: 'fast' | 'full' = useFull ? 'full' : 'full'; // 🔥 이제 항상 full로 사용

    const base = {
      stepMeters: adaptiveStep,
      radius: 350,
      includeCafe: true,
      maxTotal: budget,
      mode: modeVal,
      timeBudgetMs,
      maxSamples: Number.POSITIVE_INFINITY,
      coverage: 'sweep' as const,
    };

    if (tab === '족발/보쌈') {
      return {
        ...base,
        stepMeters: Math.min(adaptiveStep, 150),
        radius: 450,
        includeCafe: false,
        categoryGroupCodes: ['FD6'],
        keywords: JOKBAL_KEYWORDS,
        maxTotal: Math.max(base.maxTotal, 600),
      };
    }
    return base;
  };

  // 🔥 fast/full 2단계 대신, 항상 full 한 번만 호출해서 "한 번에" 보여주기
  const runAlongPathOnce = useCallback((path: LL[]) => {
    if (!Array.isArray(path) || path.length < 2) return;
    const fullOpts = { ...optsForTab(foodTab, path), mode: 'full' as const };
    searchAlongPath(path, fullOpts);
  }, [foodTab, searchAlongPath]);

  const selectRoute = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    // 🔥 마커 로딩 중일 때는 빠른길/권장길/쉬운길 전환 막기
    if (routePlacesLoading) return;

    const r = routeOptions[i];
    setMapMode('route');
    setSelectedRouteIdx(i);
    setAutoRoutePath(r.path);
    setAutoRouteInfo({ totalDistance: r.distanceM, totalTime: r.timeSec });
    setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
    setOnlySelectedMarker(false);
    resetRoutePlaces?.();
    routeQueryVerRef.current++;
    setRoutePivot(null);
    setIsPivotSelectMode(false);
    setDistanceBase(null);

    setPlaceCardOpen(true);
    runAlongPathOnce(r.path);
  }, [routeOptions, resetRoutePlaces, runAlongPathOnce, routePlacesLoading]);

  const openRouteDetail = useCallback(async (i: number) => {
    if (!routeOptions[i]) return;
    // 🔥 마커 로딩 중일 때는 상세 보기 전환도 막기
    if (routePlacesLoading) return;

    const r = routeOptions[i];
    setMapMode('route');
    setSelectedRouteIdx(i);
    setAutoRoutePath(r.path);
    setAutoRouteInfo({ totalDistance: r.distanceM, totalTime: r.timeSec });
    setExtraPlacePath([]); setExtraPlaceTarget(null); setExtraPlaceETAsec(null);
    setOnlySelectedMarker(false);
    setRoutePivot(null);
    setIsPivotSelectMode(false);
    setDistanceBase(null);

    setPlaceCardOpen(true);
    routeQueryVerRef.current++;
    runAlongPathOnce(r.path);
  }, [routeOptions, runAlongPathOnce, routePlacesLoading]);

  const tabToIconCategory = (tab: FoodTab): string =>
    tab === '카페' ? '카페' : (tab === '족발/보쌈' ? '족발' : tab);

  const onFocusOrDoubleToRoute = useCallback(
    async (p: {
      lat: number | string;
      lng: number | string;
      name?: string;
      place_name?: string;
      category_name?: string;
      place_url?: string;
      placeUrl?: string;
    }) => {
      const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
      const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      panToPlace(lat, lng, 3);

      const name = (p?.name || p?.place_name)?.toString();
      if (name) setSelectedPlaceName(name);

      // 🔥 추가 경로 시작점:
      // pivot 모드 + pivot 존재 → pivot 기준
      // 아니면 기존처럼 출발지 기준
      const startLL: LL | undefined =
        (isPivotSelectMode && routePivot)
          ? routePivot
          : (autoRouteEndpoints?.start ?? undefined);

      if (startLL) {
        try {
          const route = await getPedestrianRoute({
            start: { lat: startLL.lat, lng: startLL.lng },
            end: { lat, lng },
          } as any);

          const coords = route.path || [];
          const etaSec =
            typeof route.totalTime === 'number' ? route.totalTime : null;

          const tab = classifyPlace(p);
          const categoryForIcon = tabToIconCategory(tab);

          setExtraPlacePath(coords);
          setExtraPlaceTarget({
            lat,
            lng,
            name: (p?.name || p?.place_name || '목적지') as string,
            category: categoryForIcon,
          });
          setExtraPlaceETAsec(etaSec);

          setOnlySelectedMarker(false);
        } catch {
          // ignore
        }
      }

      // 🔥 미니뷰어 열기
      setMiniViewerPlace({
        name: (p?.name || p?.place_name || '선택한 장소') as string,
        lat,
        lng,
        placeUrl: (p as any).place_url || (p as any).placeUrl,
      });
    },
    [autoRouteEndpoints?.start, isPivotSelectMode, routePivot, panToPlace, setSelectedPlaceName],
  );

  const handleMapClick = (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    const clickedLatLng = mouseEvent.latLng;
    if (!clickedLatLng) return;

    // 1) 거리 재기 모드
    if (isDistanceMode) {
      const next = [...distancePoints, clickedLatLng];
      if (next.length <= 2) {
        setDistancePoints(next);
        if (next.length === 2) {
          const [p1, p2] = next;
          const km = haversine(
            { lat: p1.getLat(), lng: p1.getLng() },
            { lat: p2.getLat(), lng: p2.getLng() },
          ) / 1000;
          setDistanceKm(km);
        } else setDistanceKm(null);
      } else { setDistancePoints([clickedLatLng]); setDistanceKm(null); }
      return;
    }

    // 2) 수동 경로 모드(두 점 찍어서 경로 보기)
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
          new kakao.maps.LatLng(e.getLat(), e.getLng()),
        );
        return;
      }
      setRouteSelectPoints([clickedLatLng]);
      setRoutePath([]); setRouteInfo(null); setRouteError(null);
      return;
    }

    // 3) 길찾기 탭 + pivot 선택 모드일 때만 클릭 지점을 기준점으로 사용
    if (mapMode === 'route' && isPivotSelectMode) {
      setRoutePivot({
        lat: clickedLatLng.getLat(),
        lng: clickedLatLng.getLng(),
      });
      setDistanceBase(null);
    }
  };

  const isExploreMode = mapMode === 'explore';
  const isRouteModeView = mapMode === 'route';

  // 🔥 정렬 기준 포인트: pivot 모드 ON + pivot 존재 시 가장 우선
  const basePoint = useMemo<LL | null>(() => {
    if (isPivotSelectMode && routePivot) return routePivot;

    if (!distanceBase) return null;
    const originPoint = autoRouteEndpoints?.start ?? null;
    const destPoint = autoRouteEndpoints?.end ?? null;

    if (distanceBase === 'origin') return originPoint;
    if (distanceBase === 'destination') return destPoint;

    return null;
  }, [isPivotSelectMode, routePivot, distanceBase, autoRouteEndpoints]);

  const sortedRoutePlacesForList = useMemo(() => {
    if (!Array.isArray(deferredFiltered)) return deferredFiltered;
    if (!basePoint) return deferredFiltered;
    return sortPlacesByDistance(
      deferredFiltered as any[],
      basePoint.lat,
      basePoint.lng,
    );
  }, [deferredFiltered, basePoint]);

  const WALK_M_PER_MIN = 70;
  const placesWithEta = useMemo(() => {
    if (!Array.isArray(sortedRoutePlacesForList)) return sortedRoutePlacesForList;
    if (!basePoint) return sortedRoutePlacesForList;

    return (sortedRoutePlacesForList as any[]).map((p) => {
      const rawLat = (p as any).lat ?? (p as any).y;
      const rawLng = (p as any).lng ?? (p as any).x;
      const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
      const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return p;

      const distM = haversine(basePoint, { lat, lng });
      const etaMin = Math.max(1, Math.round(distM / WALK_M_PER_MIN));

      return { ...p, etaMinFromBase: etaMin };
    });
  }, [sortedRoutePlacesForList, basePoint]);

  useEffect(() => {
    if (!map) return;
    if (!autoRoutePath || autoRoutePath.length < 2) return;

    const bounds = new kakao.maps.LatLngBounds();
    autoRoutePath.forEach((p) => {
      bounds.extend(new kakao.maps.LatLng(p.lat, p.lng));
    });

    map.setBounds(bounds);

    const sidebarWidth = isSidebarOpen ? 340 : 16;
    map.panBy(-sidebarWidth / 2, 0);
  }, [map, autoRoutePath, isSidebarOpen]);

  useEffect(() => {
    if (!map) return;
    if (!routePath || routePath.length < 2) return;

    const bounds = new kakao.maps.LatLngBounds();
    routePath.forEach((p) => {
      bounds.extend(new kakao.maps.LatLng(p.lat, p.lng));
    });

    map.setBounds(bounds);

    const sidebarWidth = isSidebarOpen ? 340 : 16;
    map.panBy(-sidebarWidth / 2, 0);
  }, [map, routePath, isSidebarOpen]);

  // 🔥 "두 경로사이 맛집리스트" 패널과 미니뷰어 위치 계산
  const leftSidebarWidthValue = isSidebarOpen ? 340 : 16;
  const placeDetailGap = 16;
  const placeDetailWidth = 520;

  // 패널의 left = 사이드바 폭 + gap
  const placeDetailLeft = leftSidebarWidthValue + placeDetailGap;

  // 미니뷰어는 패널 오른쪽에 딱 붙게: 패널 left + 패널 width + gap
  const miniViewerLeft = placeDetailLeft + placeDetailWidth + 16;

  return (
    <div className="main-wrapper">
      <SearchSidebar
        searchResults={searchResults as any}
        onClickItem={(place: any) => {
          const lat = Number(place?.y); const lng = Number(place?.x);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            setSelectedIndex((searchResults as any).indexOf(place));
            panToPlace(lat, lng, 3);
          }
          if (place?.place_name) { setSelectedPlaceName(place.place_name); }
        }}
        selectedIndex={selectedIndex}
        isOpen={isSidebarOpen}
        toggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        onSearch={(kw: string) => {
          setMapMode('explore');
          routeQueryVerRef.current++;
          resetRoutePlaces?.();
          setMiniViewerPlace(null);
          setRoutePivot(null);
          setIsPivotSelectMode(false);
          setDistanceBase(null);

          const trimmed = kw.trim();

          // ✅ 공백 + 엔터 → 초기 상태로 되돌리기 (프론트 처음 켰을 때 리스트, 마커는 숨김)
          if (!trimmed) {
            setHasUserSearched(false);           // 기본 마커 숨기기
            (searchPlaces as any)('한밭대학교'); // 초기 리스트만 다시 불러오기
            return;
          }

          setHasUserSearched(true);
          (searchPlaces as any)(trimmed);
        }}
        onRouteByCoords={handleRouteByCoords}
        routePlaces={sortedRoutePlacesForList as any}
        routeLoading={routePlacesLoading}
        routeError={routePlacesError ?? null}
        onFocusRoutePlace={(p: any) => {
          const lat = Number((p?.lat ?? p?.y));
          const lng = Number((p?.lng ?? p?.x));
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            panToPlace(lat, lng, 3);
          }
          const name = (p?.name || p?.place_name);
          if (name) setSelectedPlaceName(String(name));
        }}
        routeOptions={routeOptions}
        selectedRouteIdx={selectedRouteIdx}
        onSelectRoute={selectRoute}
        onOpenRouteDetail={openRouteDetail}
        showRoutePlacesInSidebar={false}
        onChangeMapMode={(mode: 'explore' | 'route') => {
          setMapMode(mode);
          if (mode === 'explore') {
            setRoutePivot(null);
            setIsPivotSelectMode(false);
            setDistanceBase(null);
          }
        }}
      />

      {routeTargetPlace && placeCardOpen && (
        <PlaceDetailCard
          open
          place={routeTargetPlace}
          onClose={() => { setPlaceCardOpen(false); }}
          leftSidebarWidth={leftSidebarWidthValue}
          gap={placeDetailGap}
          topOffset={64}
          width={placeDetailWidth}
        >
          <div style={{
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
          >
            <div style={{ fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>
              정렬 기준:
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setIsPivotSelectMode(false);
                  setRoutePivot(null);
                  setDistanceBase((prev) => (prev === 'origin' ? null : 'origin'));
                }}
                disabled={!autoRouteEndpoints?.start || routePlacesLoading}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: distanceBase === 'origin' && !isPivotSelectMode ? '#8a2ea1' : '#e5e7eb',
                  background: distanceBase === 'origin' && !isPivotSelectMode ? '#f5ecff' : '#fff',
                  cursor: (!autoRouteEndpoints?.start || routePlacesLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!autoRouteEndpoints?.start || routePlacesLoading) ? 0.4 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                출발지 기준 정렬
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPivotSelectMode(false);
                  setRoutePivot(null);
                  setDistanceBase((prev) => (prev === 'destination' ? null : 'destination'));
                }}
                disabled={!autoRouteEndpoints?.end || routePlacesLoading}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: distanceBase === 'destination' && !isPivotSelectMode ? '#8a2ea1' : '#e5e7eb',
                  background: distanceBase === 'destination' && !isPivotSelectMode ? '#f5ecff' : '#fff',
                  cursor: (!autoRouteEndpoints?.end || routePlacesLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!autoRouteEndpoints?.end || routePlacesLoading) ? 0.4 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                도착지 기준 정렬
              </button>

              <button
                type="button"
                onClick={() => {
                  if (routePlacesLoading) return;
                  const next = !isPivotSelectMode;
                  setIsPivotSelectMode(next);
                  if (!next) {
                    setRoutePivot(null);
                  }
                  setDistanceBase(null);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: isPivotSelectMode ? '#8a2ea1' : '#e5e7eb',
                  background: isPivotSelectMode ? '#f5ecff' : '#fff',
                  cursor: routePlacesLoading ? 'not-allowed' : 'pointer',
                  opacity: routePlacesLoading ? 0.4 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                경로에서 클릭 지점 기준 정렬
              </button>

              {routePlacesLoading && (
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px dashed #8a2ea1',
                    background: '#faf5ff',
                    color: '#6b21a8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  경로 주변 맛집 로딩 중...
                </div>
              )}

              {isPivotSelectMode && routePivot && !routePlacesLoading && (
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px dashed #8a2ea1',
                    background: '#faf5ff',
                    color: '#6b21a8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  경로 클릭 지점 기준 정렬 중
                </div>
              )}
            </div>
          </div>

          <div className="pd-tabs">
            {FOOD_TABS.map((t) => (
              <button
                key={t}
                className={`pd-tab ${foodTab === t ? 'active' : ''}`}
                onClick={() => { if (!routePlacesLoading) { setFoodTab(t as any); setOnlySelectedMarker(false); } }}
                disabled={routePlacesLoading}
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
                경로 주변 맛집 <b>총 {Array.isArray(placesWithEta) ? placesWithEta.length : 0}곳</b>
              </div>
              <PlaceList
                places={placesWithEta as any}
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
          kakao.maps.event.addListener(m, 'drag', () => setIsMoving(true));
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

        {isExploreMode && hasUserSearched && Array.isArray(searchResults) && searchResults.map((place: any, index: number) => {
          const lat = Number(place?.y);
          const lng = Number(place?.x);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const group = (place?.category_group_code || '').toUpperCase();
          const isFoodGroup = group === 'FD6' || group === 'CE7';

          const key = (place?.id ?? `${lat},${lng}`) + '-' + index;

          if (isFoodGroup) {
            const tab = classifyPlace(place);
            const categoryForIcon = tabToIconCategory(tab);
            const size = 72;

            return (
              <CategoryMarker
                key={`explore-${key}`}
                lat={lat}
                lng={lng}
                category={categoryForIcon}
                size={size}
                anchorY={size}
                zIndex={105}
              />
            );
          }

          return (
            <MapMarker
              key={`explore-${key}`}
              position={{ lat, lng }}
              image={{
                src: '/assets/markers/기본마커.png',
                size: { width: 36, height: 42 },
                options: {
                  offset: { x: 18, y: 42 },
                },
              }}
            />
          );
        })}

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
            <Polyline
              path={routePath}
              strokeWeight={8}
              strokeColor="#8a2ea1ff"
              strokeOpacity={0.98}
              strokeStyle="solid"
              zIndex={70}
              onClick={(_, mouseEvent) => {
                if (!isPivotSelectMode || !mouseEvent || routePlacesLoading) return;
                const latLng = mouseEvent.latLng;
                if (!latLng) return;
                setRoutePivot({ lat: latLng.getLat(), lng: latLng.getLng() });
                setDistanceBase(null);
              }}
            />
            {!isMoving && routeBorderSegs.map((seg, i) => (
              <Polyline
                key={`rborder-${i}`}
                path={seg}
                strokeWeight={6}
                strokeColor="#FFFFFF"
                strokeOpacity={0.98}
                strokeStyle="solid"
                zIndex={80}
              />
            ))}
          </>
        )}

        {routeOptions.map((r, i) => {
          const selected = i === selectedRouteIdx;
          if (selected) return null;
          return (
            <Polyline
              key={`opt-${r.id}`}
              path={r.path}
              strokeWeight={4}
              strokeColor="#8a8a8a"
              strokeOpacity={0.5}
              strokeStyle="dash"
              zIndex={30}
            />
          );
        })}

        {autoRoutePath.length > 1 && (
          <>
            <Polyline
              path={autoRoutePath}
              strokeWeight={8}
              strokeColor="#8a2ea1ff"
              strokeOpacity={0.98}
              strokeStyle="solid"
              zIndex={75}
              onClick={(_, mouseEvent: kakao.maps.event.MouseEvent) => {
                if (!isPivotSelectMode || !mouseEvent || routePlacesLoading) return;
                const latLng = mouseEvent.latLng;
                if (!latLng) return;
                setRoutePivot({ lat: latLng.getLat(), lng: latLng.getLng() });
                setDistanceBase(null);
              }}
            />
            {!isMoving && autoBorderSegs.map((seg, i) => (
              <Polyline
                key={`aborder-${i}`}
                path={seg}
                strokeWeight={6}
                strokeColor="#FFFFFF"
                strokeOpacity={0.98}
                strokeStyle="solid"
                zIndex={85}
              />
            ))}
          </>
        )}

        {/* 🔥 pivot 모드 + pivot 있을 때만 깃발 마커 표시 */}
        {isPivotSelectMode && routePivot && (
          <MapMarker
            position={{ lat: routePivot.lat, lng: routePivot.lng }}
            image={{
              src: '/assets/markers/기본마커.png',
              size: { width: 32, height: 40 },
              options: {
                offset: { x: 16, y: 40 },
              },
            }}
            zIndex={200}
          />
        )}

        {isRouteModeView && !onlySelectedMarker && Array.isArray(markerItems) && markerItems.map((p: any, idx: number) => {
          const lat = typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat;
          const lng = typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const tab = classifyPlace(p);
          const categoryForIcon = tabToIconCategory(tab);

          const key = (p?.id ?? `${lat},${lng}`) + '-' + idx;
          const size = 112;
          return (
            <CategoryMarker
              key={`routeplace-${key}`}
              lat={lat}
              lng={lng}
              category={categoryForIcon}
              size={size}
              anchorY={size}
              zIndex={110}
            />
          );
        })}

        {isRouteModeView && extraPlacePath.length > 1 && (
          <Polyline
            path={extraPlacePath}
            strokeWeight={6}
            strokeColor="#2E86DE"
            strokeOpacity={0.95}
            strokeStyle="solid"
            zIndex={78}
          />
        )}

        {isRouteModeView && extraPlaceTarget && (
          <>
            <CategoryMarker
              lat={extraPlaceTarget.lat}
              lng={extraPlaceTarget.lng}
              category={extraPlaceTarget.category}
              size={96}
              anchorY={96}
              zIndex={130}
            />
            <CustomOverlayMap position={{ lat: extraPlaceTarget.lat, lng: extraPlaceTarget.lng }} yAnchor={1.25} zIndex={135}>
              <div className="km-label">
                {extraPlaceTarget.name}
                {typeof extraPlaceETAsec === 'number' && <> · {Math.round(extraPlaceETAsec / 60)} min</>}
              </div>
            </CustomOverlayMap>
          </>
        )}
      </Map>

      {/* 🔥 두 경로사이 맛집리스트 패널 오른쪽에 딱 붙어서 같이 이동하는 카카오맵 미니뷰어 */}
      {miniViewerPlace && (
        <PlaceMiniViewer
          place={miniViewerPlace}
          onClose={() => setMiniViewerPlace(null)}
          anchorLeft={miniViewerLeft}
        />
      )}

      <div><MenuButton /></div>
    </div>
  );
}
