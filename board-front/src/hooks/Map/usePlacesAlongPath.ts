// src/hooks/Map/usePlacesAlongPath.ts
import { useCallback, useMemo, useRef, useState } from 'react';

declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

export type LatLng = { lat: number; lng: number };

export interface PlacesAlongPathOptions {
  stepMeters?: number;           // 검색 호출을 위한 경로 샘플 간격 (API 콜 수에만 영향)
  radius?: number;               // 각 샘플 지점에서 검색 반경(m) - 최대 1000
  maxTotal?: number;             // 최종 결과 상한 (기본 200)
  includeCafe?: boolean;         // 카페(CE7) 포함 여부

  // 고급 옵션
  mode?: 'fast' | 'full';        // 안정성 위해 full 권장 (fast는 중간반영만)
  timeBudgetMs?: number;         // fast일 때만 의미
  maxSamples?: number;           // 검색 호출 샘플 상한
  coverage?: 'sweep' | 'alt';    // 샘플링 패턴
  categoryGroupCodes?: string[]; // ['FD6'] 음식점, ['FD6','CE7'] 음식+카페
  keywords?: string[];           // 특정 키워드 우선 탐색
}

export interface UsePlacesAlongPath {
  loading: boolean;
  places: any[];
  error: string | null;
  search: (path: LatLng[], opts?: PlacesAlongPathOptions) => Promise<void>;
  reset: () => void;
}

type Place = {
  id?: string | number;
  place_name?: string;
  name?: string;
  x?: string; y?: string;                   // kakao 원본
  lng?: number | string; lat?: number | string;
  address_name?: string; road_address_name?: string; phone?: string;
  category_name?: string; category_group_code?: string;

  /** 🔥 카카오 상세 URL */
  place_url?: string;
  placeUrl?: string;
};

function toRad(d: number) { return (d * Math.PI) / 180; }
function haversine(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function buildCumDist(path: LatLng[]) {
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) cum[i] = cum[i-1] + haversine(path[i-1], path[i]);
  return cum;
}
function interp(path: LatLng[], cum: number[], s: number): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (s <= 0) return path[0];
  const total = cum[cum.length - 1] || 0;
  if (s >= total) return path[path.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < s) lo = mid + 1; else hi = mid;
  }
  const i = Math.max(1, lo);
  const s0 = cum[i-1], s1 = cum[i];
  const t = (s - s0) / (s1 - s0);
  const A = path[i-1], B = path[i];
  return { lat: A.lat + (B.lat-A.lat)*t, lng: A.lng + (B.lng-A.lng)*t };
}

// 경로 해시 (캐시 키)
function hashPath(path: LatLng[]) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < path.length; i++) {
    const a = Math.round(path[i].lat * 1e5);
    const b = Math.round(path[i].lng * 1e5);
    h ^= a; h = Math.imul(h, 16777619);
    h ^= b; h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function isNear(a: LatLng, b: LatLng, tol = 15) { // 15m 이내 중복
  return haversine(a, b) <= tol;
}

function normalizePlace(p: Place) {
  const lat = typeof p.y === 'string' ? parseFloat(p.y) :
              (typeof p.lat === 'string' ? parseFloat(p.lat) : (p.lat as number));
  const lng = typeof p.x === 'string' ? parseFloat(p.x) :
              (typeof p.lng === 'string' ? parseFloat(p.lng) : (p.lng as number));
  const name = (p.place_name ?? p.name ?? '이름 없음') as string;
  const address = (p.address_name ?? '') as string;
  const roadAddress = (p.road_address_name ?? '') as string;

  const placeUrl = (p.placeUrl ?? p.place_url) as string | undefined;

  return {
    ...p,
    name,
    place_name: name,
    lat,
    lng,
    address,
    roadAddress,
    placeUrl,
    place_url: placeUrl ?? p.place_url,
  };
}
function toKey(p: any) {
  if (typeof p?.id === 'string' && p.id) return p.id;
  if (typeof p?.id === 'number') return String(p.id);
  return `${String(p?.lat ?? '')},${String(p?.lng ?? '')}`;
}

// 경로 세그먼트(평면 근사) 투영으로 s 계산 -------------------------------
// 경로 주변 수백 m 규모에서 평면 근사로 충분히 정확.
type XY = { x: number; y: number };
const R = 6371000;
function ll2xy(lat0: number, lng0: number, p: LatLng): XY {
  const dLat = toRad(p.lat - lat0);
  const dLng = toRad(p.lng - lng0);
  const x = R * Math.cos(toRad(lat0)) * dLng;
  const y = R * dLat;
  return { x, y };
}
function dot(a: XY, b: XY) { return a.x*b.x + a.y*b.y; }
function sub(a: XY, b: XY) { return { x: a.x-b.x, y: a.y-b.y }; }
function norm2(a: XY) { return a.x*a.x + a.y*a.y; }

/** 경로 polyline과 장소 좌표 p가 주어졌을 때, p를 가장 가까운 세그먼트에 투영해서
 *  누적거리 s(단위 m)를 계산한다. 반환: { s, d } (d는 거리, 진단용) */
function projectPointOntoPathS(path: LatLng[], cum: number[], p: LatLng): { s: number; d: number } {
  // 기준 원점(첫 점)으로 평면 근사 좌표 변환
  const origin = path[0];
  const pts: XY[] = path.map(pt => ll2xy(origin.lat, origin.lng, pt));
  const P = ll2xy(origin.lat, origin.lng, p);

  let bestS = 0;
  let bestD2 = Number.POSITIVE_INFINITY;

  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i+1];
    const AB = sub(B, A);
    const AP = sub(P, A);
    const ab2 = norm2(AB);
    if (ab2 === 0) continue;
    // 직선상 파라미터 t
    let t = dot(AP, AB) / ab2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    // 투영점과 거리
    const proj = { x: A.x + AB.x * t, y: A.y + AB.y * t };
    const d2 = norm2(sub(P, proj));
    if (d2 < bestD2) {
      bestD2 = d2;
      const segLen = haversine(path[i], path[i+1]); // m (정확성을 위해 구면거리 사용)
      bestS = (cum[i] ?? 0) + segLen * t;
    }
  }
  return { s: bestS, d: Math.sqrt(bestD2) };
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit = 4,
  shouldStop?: () => boolean,
  onPartial?: (index: number, value: T) => void
) {
  const ret: (T | undefined)[] = new Array(tasks.length);
  let i = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
    while (i < tasks.length && !(shouldStop && shouldStop())) {
      const cur = i++;
      try {
        const v = await tasks[cur]();
        ret[cur] = v;
        onPartial?.(cur, v);
      } catch { /* ignore */ }
    }
  });
  await Promise.all(workers);
  return ret.filter((v): v is T => v !== undefined);
}

export default function usePlacesAlongPath(): UsePlacesAlongPath {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const verRef = useRef(0);

  // LRU 캐시 (full 결과만 저장)
  const cacheRef = useRef<Map<string, any[]>>(new Map());
  const touchCache = (k: string, v?: any[]) => {
    const c = cacheRef.current;
    if (c.has(k)) c.delete(k);
    if (v) c.set(k, v);
    else {
      const prev = c.get(k);
      if (prev) c.set(k, prev);
    }
    if (c.size > 20) {
      const it = c.keys();
      const first = it.next();
      if (!first.done) c.delete(first.value);
    }
  };

  const reset = useCallback(() => {
    verRef.current++;
    setPlaces([]);
    setError(null);
    setLoading(false);
  }, []);

  const search = useCallback(async (path: LatLng[], opts?: PlacesAlongPathOptions) => {
    if (!kakao?.maps?.services || !Array.isArray(path) || path.length < 2) {
      setError('지도/경로가 준비되지 않았습니다.');
      return;
    }

    const startVer = ++verRef.current;

    const o = opts ?? {};
    const stepMeters = o.stepMeters ?? 250;             // API 콜 수 튜닝용
    const radius = o.radius ?? 250;
    const maxTotal = o.maxTotal ?? 200;                 // 최종 상한 (요청: 200)
    const includeCafe = o.includeCafe !== false;
    const mode: 'fast' | 'full' = o.mode ?? 'full';     // 안정성 위해 full 권장
    const timeBudgetMs = o.timeBudgetMs ?? (mode === 'fast' ? 1500 : 0);
    const maxSamples = o.maxSamples ?? Number.POSITIVE_INFINITY;
    const coverage: 'sweep' | 'alt' = o.coverage ?? 'sweep';
    const categoryGroupCodes = o.categoryGroupCodes;
    const keywords = o.keywords;

    const safeRadius = Math.max(1, Math.min(1000, radius));
    const groupCodes = (Array.isArray(categoryGroupCodes) && categoryGroupCodes.length > 0
      ? categoryGroupCodes
      : (includeCafe ? ['FD6', 'CE7'] : ['FD6']))
      .filter((c): c is string => typeof c === 'string' && c.length > 0);
    const kwList = Array.isArray(keywords)
      ? keywords.filter((k): k is string => typeof k === 'string' && k.length > 0)
      : [];

    // 경로 기본 정보
    const cum = buildCumDist(path);
    const total = cum[cum.length - 1] || 0;
    if (total <= 0) { setPlaces([]); setLoading(false); return; }

    // 검색 호출용 샘플 (stepMeters 간격) — 선택 로직과는 분리됨
    const samples: LatLng[] = [];
    const step = Math.max(50, stepMeters);
    for (let s = 0; s <= total; s += step) {
      samples.push(interp(path, cum, s));
      if (samples.length >= maxSamples) break;
    }
    const sampleOrder = coverage === 'sweep' ? samples : samples;

    // 캐시 키 (mode 제외)
    const routeHash = hashPath(path);
    const cacheKey = JSON.stringify({
      routeHash, step: stepMeters, r: safeRadius, includeCafe,
      groupCodes, kw: kwList
    });
    const hit = cacheRef.current.get(cacheKey);
    if (hit && hit.length > 0) {
      touchCache(cacheKey);
      setPlaces(hit.slice(0, maxTotal));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    if (mode === 'fast') setPlaces([]);

    // 수집
    const raw: any[] = [];
    const svc = new kakao.maps.services.Places();
    const startedAt = Date.now();

    const shouldStop = () => {
      if (verRef.current !== startVer) return true;
      if (mode === 'fast' && timeBudgetMs > 0 && Date.now() - startedAt > timeBudgetMs) return true;
      if (raw.length >= Math.max(800, maxTotal * 8)) return true; // 여유 수집 상한
      return false;
    };

    const keywordSearch = (q: string, loc: LatLng) => new Promise<Place[]>((resolve) => {
      svc.keywordSearch(q, (data: Place[], status: string) => {
        resolve(status === kakao.maps.services.Status.OK ? (data ?? []) : []);
      }, { location: new kakao.maps.LatLng(loc.lat, loc.lng), radius: safeRadius });
    });
    const categorySearch = (code: string, loc: LatLng) => new Promise<Place[]>((resolve) => {
      svc.categorySearch(code, (data: Place[], status: string) => {
        resolve(status === kakao.maps.services.Status.OK ? (data ?? []) : []);
      }, { location: new kakao.maps.LatLng(loc.lat, loc.lng), radius: safeRadius });
    });
    const pushRaw = (cands: any[]) => {
      for (const r of cands) {
        raw.push(normalizePlace(r as any));
        if (raw.length >= Math.max(800, maxTotal * 8)) break;
      }
    };

    const tasks: Array<() => Promise<void>> = [];
    for (const loc of sampleOrder) {
      if (kwList.length > 0) {
        for (const kw of kwList) {
          tasks.push(async () => {
            if (shouldStop()) return;
            const res = await keywordSearch(kw, loc);
            if (shouldStop()) return;
            pushRaw(res);
          });
        }
      } else {
        for (const code of groupCodes) {
          tasks.push(async () => {
            if (shouldStop()) return;
            const res = await categorySearch(code, loc);
            if (shouldStop()) return;
            pushRaw(res);
          });
        }
      }
    }

    const onPartial = mode === 'fast'
      ? () => { setPlaces(raw.slice(0, Math.min(raw.length, 60))); }
      : undefined;

    try {
      await runWithConcurrency(tasks, 4, shouldStop, onPartial);
      if (verRef.current !== startVer) return;

      // ---- 결정적 s 계산: 경로에 직접 투영 --------------------------------
      const withS = raw
        .filter(p => Number.isFinite(+p.lat) && Number.isFinite(+p.lng))
        .map(p => {
          const prj = projectPointOntoPathS(path, cum, { lat: +p.lat, lng: +p.lng });
          return { ...p, __s: prj.s, __d: prj.d };
        });

      // 우선 정렬: s → 카테고리(FD6,CE7,기타) → 이름 → id (결정적)
      const catRank = (c?: string) => (c === 'FD6' ? 0 : c === 'CE7' ? 1 : 2);
      withS.sort((A: any, B: any) => {
        if (A.__s !== B.__s) return A.__s - B.__s;
        const ca = catRank(A.category_group_code), cb = catRank(B.category_group_code);
        if (ca !== cb) return ca - cb;
        const na = (A.place_name || A.name || '') as string;
        const nb = (B.place_name || B.name || '') as string;
        if (na !== nb) return na.localeCompare(nb);
        const ia = (A.id ? String(A.id) : `${A.lat},${A.lng}`);
        const ib = (B.id ? String(B.id) : `${B.lat},${B.lng}`);
        return ia.localeCompare(ib);
      });

      // ---- 균등 선택: 총 길이/타깃 개수 간격으로 듬성듬성 -------------------
      const TARGET = Math.min(200, Math.max(1, maxTotal));
      const minGap = total > 0 ? total / TARGET : Number.POSITIVE_INFINITY;

      const picked: any[] = [];
      const seen = new Set<string>();
      const keepCoords: LatLng[] = [];
      let lastS = -Infinity;

      // 1차: greedy (s 간격 >= minGap, 15m 중복 제거)
      for (const p of withS) {
        if (picked.length >= TARGET) break;
        if ((p.__s as number) - lastS < minGap) continue;

        const key = p.id ? String(p.id) : `${p.lat},${p.lng}`;
        if (seen.has(key)) continue;

        const pos = { lat: +p.lat, lng: +p.lng };
        if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) continue;

        let dup = false;
        for (const prev of keepCoords) { if (isNear(prev, pos, 15)) { dup = true; break; } }
        if (dup) continue;

        seen.add(key);
        keepCoords.push(pos);
        picked.push(p);
        lastS = p.__s as number;
      }

      // 2차 보충: 아직 부족하면, 현 선택집합과의 s-거리(가장 가까운 선택의 s와의 거리)가 큰 순으로 채우기
      if (picked.length < TARGET) {
        // 빠른 최근접 s 거리 계산을 위해 pick의 s 배열 준비
        const selS = picked.map(p => p.__s as number).sort((a,b)=>a-b);
        const sDistToSel = (s: number) => {
          if (selS.length === 0) return Number.POSITIVE_INFINITY;
          // 이진탐색으로 가장 가까운 선택 s 찾기
          let lo = 0, hi = selS.length;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (selS[mid] < s) lo = mid + 1; else hi = mid;
          }
          let best = Number.POSITIVE_INFINITY;
          if (lo < selS.length) best = Math.min(best, Math.abs(selS[lo] - s));
          if (lo > 0) best = Math.min(best, Math.abs(selS[lo-1] - s));
          return best;
        };

        // 후보들 평가 (아직 안 뽑힌 것만)
        const cand: any[] = [];
        const have = new Set<string>(picked.map(p => (p.id ? String(p.id) : `${p.lat},${p.lng}`)));
        for (const p of withS) {
          const key = p.id ? String(p.id) : `${p.lat},${p.lng}`;
          if (have.has(key)) continue;
          cand.push({ p, gap: sDistToSel(p.__s as number) });
        }
        cand.sort((a,b)=> b.gap - a.gap || (a.p.__s - b.p.__s));

        for (const { p } of cand) {
          if (picked.length >= TARGET) break;
          // 좌표 근접 중복 제거
          const pos = { lat: +p.lat, lng: +p.lng };
          let dup = false;
          for (const prev of keepCoords) { if (isNear(prev, pos, 15)) { dup = true; break; } }
          if (dup) continue;

          picked.push(p);
          keepCoords.push(pos);
          // selS에 삽입(정렬 유지)
          const s = p.__s as number;
          let lo = 0, hi = selS.length;
          while (lo < hi) { const mid = (lo+hi)>>1; if (selS[mid] < s) lo = mid+1; else hi = mid; }
          selS.splice(lo, 0, s);
        }
      }

      // 최종 결과: s 순서 유지, 상한 적용
      picked.sort((a,b)=> (a.__s as number) - (b.__s as number));
      const finalList = picked.slice(0, TARGET);

      setPlaces(finalList);
      setError(null);

      if (mode === 'full') {
        cacheRef.current.set(cacheKey, finalList);
        touchCache(cacheKey, finalList);
      }
    } catch (e) {
      if (verRef.current !== startVer) return;
      setError('경로 주변 장소 검색 중 오류가 발생했습니다.');
    } finally {
      if (verRef.current === startVer) setLoading(false);
    }
  }, []);

  return useMemo<UsePlacesAlongPath>(() => ({
    loading, places, error, search, reset
  }), [loading, places, error, search, reset]);
}
