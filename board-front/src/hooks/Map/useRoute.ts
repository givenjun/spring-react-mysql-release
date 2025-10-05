import { useCallback, useMemo, useState } from 'react';
import { getPedestrianRoute } from 'apis/tmap';
import { EASE_PARAMS } from 'constant';

// === 로컬 타입 ===
export interface LatLng { lat: number; lng: number }
export interface Coords { lat: number; lng: number; name?: string }

export interface RouteOption {
  id: string;
  name: '빠른길' | '권장길' | '쉬운길';
  timeSec: number;      // 초
  distanceM: number;    // 미터
  complexity: number;   // 낮을수록 쉬움
  path: LatLng[];
  easeDetail?: {
    curvaturePerKm: number;
    hardTurnsPerKm: number;
    zigzagRate: number;
    shortSegRate: number;
  };
  // 품질 점검용 부가 지표
  detourRatio?: number;     // 총거리 / 직선거리
  uturnCount?: number;      // 150° 이상 U턴 개수
  backtrackRate?: number;   // 목적지까지의 거리 증가 비율
}

// === 유틸 ===
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function haversine(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a: LatLng, b: LatLng) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
            Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return Math.atan2(y, x);
}

// 좌/우 오프셋
function offsetByMeters(p: LatLng, azimuthRad: number, d: number, side: 'left' | 'right'): LatLng {
  const mPerDegLat = 110540;
  const mPerDegLng = 111320 * Math.cos(toRad(p.lat));
  const theta = azimuthRad + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
  const dx = (d * Math.cos(theta)) / mPerDegLng;
  const dy = (d * Math.sin(theta)) / mPerDegLat;
  return { lat: p.lat + dy, lng: p.lng + dx };
}

// === 개선된 쉬움 지표 ===
function complexityScore(path: LatLng[]) {
  const P = EASE_PARAMS;
  if (!path || path.length < 2) {
    return { score: 0, detail: { curvaturePerKm: 0, hardTurnsPerKm: 0, zigzagRate: 0, shortSegRate: 0 } };
  }

  let totalLen = 0;
  let shortSeg = 0;
  let hardTurns = 0;
  let zigzagSwitch = 0;
  let prevTurnSign = 0;
  let curvatureSumDeg = 0;

  for (let i = 1; i < path.length; i++) {
    const seg = haversine(path[i - 1], path[i]);
    totalLen += seg;
    if (seg <= P.shortSegM) shortSeg++;

    if (i < path.length - 1) {
      const a = bearing(path[i - 1], path[i]);
      const b = bearing(path[i], path[i + 1]);
      let d = b - a;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;

      const deg = Math.abs(toDeg(d));
      if (deg >= P.kinkDeg) curvatureSumDeg += deg;
      if (deg >= P.hardTurnDeg) hardTurns++;

      const sign = d > 0 ? 1 : -1;
      if (prevTurnSign && sign !== prevTurnSign) zigzagSwitch++;
      if (deg >= P.kinkDeg) prevTurnSign = sign;
    }
  }

  const lengthKm = Math.max(P.minPathMeters, totalLen) / 1000;
  const curvaturePerKm = curvatureSumDeg / lengthKm;
  const hardTurnsPerKm = hardTurns / lengthKm;
  const shortSegRate   = shortSeg / Math.max(1, path.length - 1);
  const zigzagRate     = zigzagSwitch / Math.max(1, path.length - 2);

  const score =
    P.wCurvature * curvaturePerKm +
    P.wHardTurns * hardTurnsPerKm +
    P.wZigzag    * zigzagRate +
    P.wShortSeg  * shortSegRate;

  return { score, detail: { curvaturePerKm, hardTurnsPerKm, zigzagRate, shortSegRate }, totalLen };
}

// === 품질 점검 지표: detour/uturn/backtrack ===
function qualityFlags(path: LatLng[], end: LatLng, beelineM: number) {
  if (!path || path.length < 2) return { detourRatio: 1, uturnCount: 0, backtrackRate: 0 };

  // detour ratio
  let total = 0;
  for (let i = 1; i < path.length; i++) total += haversine(path[i-1], path[i]);
  const detourRatio = total / Math.max(1, beelineM);

  // U-turns(>=150°)
  let uturnCount = 0;
  let increases = 0; // backtrack steps
  for (let i = 1; i < path.length - 1; i++) {
    const a = bearing(path[i - 1], path[i]);
    const b = bearing(path[i], path[i + 1]);
    let d = Math.abs(toDeg(b - a));
    while (d > 180) d = 360 - d;
    if (d >= 150) uturnCount++;

    // backtrack: 목적지까지의 거리 증가
    const dPrev = haversine(path[i - 1], end);
    const dCur  = haversine(path[i], end);
    if (dCur - dPrev > 5) increases++; // 5m 이상 멀어지면 역진으로 간주
  }
  const backtrackRate = increases / Math.max(1, path.length - 2);

  return { detourRatio, uturnCount, backtrackRate, totalLength: total };
}

// === 경로 중복 제거 유틸 ===
function cumLengths(path: { lat: number; lng: number }[]) {
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens[i] = lens[i - 1] + haversine(path[i - 1], path[i]);
  return lens;
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pointAtDistance(path: { lat: number; lng: number }[], target: number) {
  if (path.length < 2) return path[0] ?? { lat: 0, lng: 0 };
  const lens = cumLengths(path);
  const total = lens[lens.length - 1] || 1;
  let i = 1;
  while (i < lens.length && lens[i] < target) i++;
  if (i === lens.length) return path[path.length - 1];
  const segLen = lens[i] - lens[i - 1] || 1;
  const t = (target - lens[i - 1]) / segLen;
  return { lat: lerp(path[i - 1].lat, path[i].lat, t), lng: lerp(path[i - 1].lng, path[i].lng, t) };
}
function signatureKey(r: { path: LatLng[]; timeSec: number; distanceM: number }) {
  const p = r.path;
  if (!p || p.length < 2) return `empty|t:${r.timeSec}|d:${r.distanceM}`;
  const lens = cumLengths(p);
  const L = lens[lens.length - 1] || 1;
  const picks = [0, 0.25, 0.5, 0.75, 1].map(f => pointAtDistance(p, L * f));
  const fix = (x: number) => x.toFixed(3);
  const dBin = Math.round(r.distanceM / 100);
  const tBin = Math.round(r.timeSec / 180);
  return [`d:${dBin}`, `t:${tBin}`, ...picks.map(pt => `${fix(pt.lat)},${fix(pt.lng)}`)].join('|');
}
function dedupeBySignature<T extends { path: LatLng[]; timeSec: number; distanceM: number }>(arr: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const key = signatureKey({ path: it.path, timeSec: it.timeSec, distanceM: it.distanceM });
    if (!seen.has(key)) { seen.add(key); out.push(it); }
  }
  return out;
}

// 응답 파싱
function extractRouteBasics(resp: any): { path: LatLng[]; timeSec: number; distanceM: number } {
  if (resp?.path && resp?.timeSec != null && resp?.distanceM != null)
    return { path: resp.path, timeSec: resp.timeSec, distanceM: resp.distanceM };

  if (Array.isArray(resp?.features)) {
    const coords: LatLng[] = [];
    let time = 0, dist = 0;
    for (const f of resp.features) {
      if (f.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)) {
        for (const c of f.geometry.coordinates) {
          if (Array.isArray(c) && c.length >= 2) coords.push({ lat: c[1], lng: c[0] });
        }
      }
      if (f.properties?.time)     time += Number(f.properties.time) || 0;
      if (f.properties?.distance) dist += Number(f.properties.distance) || 0;
    }
    return { path: coords, timeSec: Math.round(time / 1000), distanceM: dist };
  }

  const path: LatLng[] = resp?.points || resp?.path || [];
  const timeSec: number = resp?.totalTime ?? resp?.timeSec ?? 0;
  const distanceM: number = resp?.totalDistance ?? resp?.distanceM ?? 0;
  return { path, timeSec, distanceM };
}

// via 1개 넣어서 대안 경로
async function fetchViaVariant(start: Coords, end: Coords, via: LatLng) {
  const body: any = { start, end, viaPoints: [{ lat: via.lat, lng: via.lng }] };
  const raw = await getPedestrianRoute(body);
  return extractRouteBasics(raw);
}
async function fetchBase(start: Coords, end: Coords) {
  const raw = await getPedestrianRoute({ start, end });
  return extractRouteBasics(raw);
}

// 기준 경로 중간 좌/우로 60m 오프셋 (끝점 150m 이내는 제외: 되돌이 방지)
function makeOffsetVias(basePath: LatLng[], d = 60, end?: LatLng): { left?: LatLng; right?: LatLng } {
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

  let acc = 0, idx = 0;
  for (; idx < segLen.length; idx++) {
    if (acc + segLen[idx] >= target) break;
    acc += segLen[idx];
  }
  const i = Math.min(Math.max(0, idx), basePath.length - 2);
  const a = basePath[i], b = basePath[i + 1];

  const az = bearing(a, b);
  const mid: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const cand = {
    left:  offsetByMeters(mid, az, d, 'left'),
    right: offsetByMeters(mid, az, d, 'right'),
  };

  // 목적지와 너무 가까운 via는 제거(되돌이 유발)
  if (end) {
    for (const k of ['left','right'] as const) {
      const v = (cand as any)[k] as LatLng | undefined;
      if (v && haversine(v, end) < 150) (cand as any)[k] = undefined;
    }
  }
  return cand;
}

// === 훅 구현 ===
export function useRoute() {
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeByCoords = useCallback(async (start: Coords, end: Coords) => {
    setLoading(true);
    setError(null);
    try {
      // 1) 기본 경로
      const base = await fetchBase(start, end);
      if (!base.path || base.path.length < 2) throw new Error('경로가 비어 있습니다.');

      const beeline = haversine(start, end);

      // 2) via 후보 생성(끝점 근접 via 제거)
      const { left, right } = makeOffsetVias(base.path, 60, end);
      const variants = await Promise.all([
        Promise.resolve(base),
        left  ? fetchViaVariant(start, end, left)  : Promise.resolve(null),
        right ? fetchViaVariant(start, end, right) : Promise.resolve(null),
      ]);

      // 3) 스코어 + 품질지표
      const withScores = variants
        .filter(Boolean)
        .map((v: any, idx: number) => {
          const path = v.path as LatLng[];
          const timeSec = Number(v.timeSec) || 0;
          const distanceM = Number(v.distanceM) || 0;

          const ease = complexityScore(path);
          const q = qualityFlags(path, end, beeline);
          return {
            id: `cand-${idx}`,
            name: '권장길' as RouteOption['name'],
            timeSec: Math.round(timeSec),
            distanceM: Math.round(distanceM),
            complexity: ease.score,
            path,
            easeDetail: ease.detail,
            detourRatio: q.detourRatio,
            uturnCount: q.uturnCount,
            backtrackRate: q.backtrackRate,
          } satisfies RouteOption;
        });

      if (withScores.length === 0) throw new Error('대안 경로 생성에 실패했습니다.');

      // 3.5) 중복 제거
      let pool = dedupeBySignature(withScores);

      // 3.6) 빠른길 기준 계산
      const idxFastRaw = pool.reduce((b,c,i)=> (c.timeSec < pool[b].timeSec ? i : b), 0);
      const fast = pool[idxFastRaw];
      const fastDetour = fast.detourRatio ?? 1;

      // 3.7) 불량 루트 필터 (되돌이/과도우회) — 단, 쉬움 25%+ 개선이면 살림
      const filtered = pool.filter(r => {
        const muchEasier = r.complexity <= fast.complexity * 0.75;
        const badDetour = (r.detourRatio ?? 9) > fastDetour * 1.15;
        const badBack   = (r.backtrackRate ?? 0) > 0.15;
        const badUTurn  = (r.uturnCount ?? 0) > 0;
        const isBad = badDetour || badBack || badUTurn;
        return !isBad || muchEasier;
      });
      pool = filtered.length ? filtered : pool; // 전부 걸러지면 원본 유지

      // 4) 라벨링 — 너가 정의한 정책 반영
      const times = pool.map(s => s.timeSec);
      const comps = pool.map(s => s.complexity);
      const tMin = Math.min(...times), tMax = Math.max(...times);
      const cMin = Math.min(...comps), cMax = Math.max(...comps);
      const norm = (v: number, lo: number, hi: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));

      const idxFast = pool.reduce((b,c,i)=> (c.timeSec < pool[b].timeSec ? i : b), 0);
      const fastRef = pool[idxFast];

      // 쉬운길 후보: 빠른길 대비 시간/거리 20% 이내 + 불량 아님, 그중 complexity 최소
      const easyCandidates = pool
        .map((r, i) => ({ r, i }))
        .filter(x => x.i !== idxFast)
        .filter(({ r }) => {
          const timeOK = r.timeSec <= fastRef.timeSec * 1.20;
          const distOK = r.distanceM <= fastRef.distanceM * 1.20;
          const detourOK = (r.detourRatio ?? 1) <= (fastRef.detourRatio ?? 1) * 1.20;
          const noBack = (r.backtrackRate ?? 0) <= 0.15 && (r.uturnCount ?? 0) === 0;
          return timeOK && distOK && detourOK && noBack;
        })
        .sort((a,b) => a.r.complexity - b.r.complexity);

      const idxEasy = easyCandidates.length ? easyCandidates[0].i : idxFast;

      // 권장길: 0.6*time + 0.4*ease 최소 (남은 후보 중)
      const balScore = pool.map(s => 0.6 * norm(s.timeSec, tMin, tMax) + 0.4 * norm(s.complexity, cMin, cMax));
      const idxBal = balScore.indexOf(Math.min(...balScore));

      const named = pool.map((s, i) => {
        let name: RouteOption['name'] = '권장길';
        if (i === idxFast) name = '빠른길';
        else if (i === idxEasy) name = '쉬운길';
        else if (i === idxBal) name = '권장길';
        return { ...s, id: `route-${name}-${i}`, name };
      });

      const order = { '빠른길': 0, '권장길': 1, '쉬운길': 2 } as const;
      named.sort((a, b) => order[a.name] - order[b.name]);

      setOptions(named);
      setSelectedIndex(0);
    } catch (e: any) {
      setError(e?.message || '경로 생성 중 오류가 발생했습니다.');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // === 하위 호환 어댑터 ===
  const selected = options[selectedIndex];

  const fetchCompat = useCallback(async (arg1: any, arg2?: any) => {
    if (arg2 && typeof arg1 === 'object' && typeof arg2 === 'object' && 'lat' in arg1 && 'lng' in arg1 && 'lat' in arg2 && 'lng' in arg2) {
      return routeByCoords(arg1 as Coords, arg2 as Coords);
    }
    const req = arg1 ?? {};
    const start: Coords | null =
      req.start && typeof req.start === 'object' && 'lat' in req.start && 'lng' in req.start
        ? { lat: Number(req.start.lat), lng: Number(req.start.lng) }
        : (req.startLat != null && req.startLng != null ? { lat: Number(req.startLat), lng: Number(req.startLng) } : null);
    const end: Coords | null =
      req.end && typeof req.end === 'object' && 'lat' in req.end && 'lng' in req.end
        ? { lat: Number(req.end.lat), lng: Number(req.end.lng) }
        : (req.endLat != null && req.endLng != null ? { lat: Number(req.endLat), lng: Number(req.endLng) } : null);

    if (!start || !end) throw new Error('요청에 start/end 좌표가 없습니다.');
    return routeByCoords(start, end);
  }, [routeByCoords]);

  const compat = useMemo(() => ({
    path: selected?.path ?? [],
    totalDistance: selected?.distanceM,
    totalTime: selected?.timeSec,
    fetch: fetchCompat,
    clear: () => { setOptions([]); setSelectedIndex(0); },
  }), [selected, fetchCompat]);

  return {
    options,
    selectedIndex,
    setSelectedIndex,
    loading,
    error,
    routeByCoords,
    ...compat,
  };
}
