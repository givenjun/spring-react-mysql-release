// // src/hooks/Map/usePlacesAlongPath.ts
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useCallback, useRef, useState } from "react";
// import type { LatLng } from "../../apis/request/tmap";

// declare global {
//   interface Window { kakao: any; }
// }

// export type Place = {
//   id: string;
//   name: string;
//   lat: number;
//   lng: number;
//   address: string;
//   roadAddress?: string;
//   phone?: string;
//   category?: string;
//   category_group_code?: string; // ← 추가
//   categoryGroupCode?: string;    // ← 선택: 카멜케이스도 함께 보관
// };

// // --- 거리/보간 유틸 ---
// const toRad = (d: number) => (d * Math.PI) / 180;
// const haversineM = (a: LatLng, b: LatLng) => {
//   const R = 6371000;
//   const dLat = toRad(b.lat - a.lat);
//   const dLng = toRad(b.lng - a.lng);
//   const lat1 = toRad(a.lat);
//   const lat2 = toRad(b.lat);
//   const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//   return 2 * R * Math.asin(Math.sqrt(h));
// };

// function buildCum(path: LatLng[]) {
//   const cum: number[] = [0];
//   for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversineM(path[i - 1], path[i]);
//   return cum;
// }
// function interp(path: LatLng[], cum: number[], s: number): LatLng {
//   if (path.length === 0) return { lat: 0, lng: 0 };
//   if (s <= 0) return path[0];
//   const total = cum[cum.length - 1] || 0;
//   if (s >= total) return path[path.length - 1];
//   let lo = 0, hi = cum.length - 1;
//   while (lo < hi) {
//     const mid = Math.floor((lo + hi) / 2);
//     if (cum[mid] < s) lo = mid + 1; else hi = mid;
//   }
//   const i = Math.max(1, lo);
//   const s0 = cum[i - 1], s1 = cum[i];
//   const t = (s - s0) / (s1 - s0);
//   const A = path[i - 1], B = path[i];
//   return { lat: A.lat + (B.lat - A.lat) * t, lng: A.lng + (B.lng - A.lng) * t };
// }
// function sampleAlong(path: LatLng[], stepM = 40): LatLng[] {
//   if (!path || path.length < 2) return [];
//   const cum = buildCum(path);
//   const total = cum[cum.length - 1] || 0;
//   const pts: LatLng[] = [];
//   for (let s = 0; s <= total; s += stepM) pts.push(interp(path, cum, s));
//   pts.push(path[path.length - 1]); // 마지막점 보장
//   return pts;
// }

// // --- Kakao Places 카테고리 검색(페이지 1~3) ---
// async function searchCategoryAround(
//   svc: any,
//   category: string,
//   loc: LatLng,
//   radius: number
// ): Promise<any[]> {
//   const all: any[] = [];
//   for (let page = 1; page <= 3; page++) {
//     const res: any[] = await new Promise((resolve, reject) => {
//       svc.categorySearch(
//         category,
//         (data: any[], status: string) => {
//           const S = (window as any).kakao.maps.services.Status;
//           if (status === S.OK) resolve(data);
//           else if (status === S.ZERO_RESULT) resolve([]);
//           else reject(new Error(status));
//         },
//         {
//           location: new (window as any).kakao.maps.LatLng(loc.lat, loc.lng),
//           radius,
//           page,
//           sort: (window as any).kakao.maps.services.SortBy.DISTANCE
//         }
//       );
//     });
//     if (!res.length) break;
//     all.push(...res);
//     if (res.length < 15) break; // 마지막 페이지
//   }
//   return all;
// }

// export function usePlacesAlongPath() {
//   const [loading, setLoading] = useState(false);
//   const [places, setPlaces] = useState<Place[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const cancelRef = useRef<{ canceled: boolean } | null>(null);

//   const search = useCallback(async (
//     path: LatLng[],
//     options?: { stepMeters?: number; radius?: number; maxTotal?: number }
//   ) => {
//     if (!Array.isArray(path) || path.length < 2) {
//       setPlaces([]);
//       return;
//     }
//     if (!(window as any)?.kakao?.maps?.services) {
//       setError("카카오 SDK가 로드되지 않았습니다.");
//       return;
//     }

//     const stepMeters = options?.stepMeters ?? 40;   // 촘촘히
//     const radius     = options?.radius ?? 280;      // 반경 확대
//     const MAX_TOTAL  = options?.maxTotal ?? 600;    // 안전장치

//     setLoading(true);
//     setError(null);
//     const localCancel = { canceled: false };
//     cancelRef.current = localCancel;

//     try {
//       const services = new (window as any).kakao.maps.services.Places();
//       const samples = sampleAlong(path, stepMeters);
//       const idMap = new Map<string, Place>();
//       const CATS = ["FD6", "CE7"]; // 음식점 + 카페

//       for (let i = 0; i < samples.length; i++) {
//         if (cancelRef.current !== localCancel || localCancel.canceled) break;

//         for (const cat of CATS) {
//           // eslint-disable-next-line no-await-in-loop
//           const around = await searchCategoryAround(services, cat, samples[i], radius);
//           for (const r of around) {
//             const pid = String(r.id ?? r.place_id ?? r.placeId ?? `${r.place_url ?? ""}-${r.y}-${r.x}`);
//             if (idMap.has(pid)) continue;

//             const lat = parseFloat(r.y);
//             const lng = parseFloat(r.x);
//             if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

//             idMap.set(pid, {
//               id: pid,
//               name: r.place_name,
//               lat, lng,
//               address: r.address_name,
//               roadAddress: r.road_address_name || undefined,
//               phone: r.phone || undefined,
//               category: r.category_name || undefined, // 카테고리 텍스트(예: "카페 > ...")
//               category_group_code: r.category_group_code || undefined, // ← 추가
//             });

//             if (idMap.size >= MAX_TOTAL) break;
//           }
//           if (idMap.size >= MAX_TOTAL) break;
//         }
//         if (idMap.size >= MAX_TOTAL) break;
//       }

//       if (cancelRef.current !== localCancel || localCancel.canceled) return;
//       setPlaces(Array.from(idMap.values()));
//     } catch (e: any) {
//       if (cancelRef.current === localCancel) {
//         setError(e?.message ?? "경로 주변 장소 검색 실패");
//       }
//     } finally {
//       if (cancelRef.current === localCancel) setLoading(false);
//     }
//   }, []);

//   const reset = useCallback(() => {
//     setPlaces([]);
//     setError(null);
//     setLoading(false);
//     cancelRef.current = null;
//   }, []);

//   return { loading, places, error, search, reset };
// }

// export default usePlacesAlongPath;

import { useCallback, useMemo, useRef, useState } from 'react';

export type LatLng = { lat: number; lng: number };

export interface Place {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  roadAddress?: string;
  phone?: string;
  category?: string;
  category_group_code?: string;
  category_name?: string;
}

interface SearchOptions {
  stepMeters?: number;        // 경로 샘플 간격(m)
  radius?: number;            // 각 샘플 지점 주변 탐색 반경(m)
  maxSamples?: number;        // 샘플 지점 상한
  maxTotal?: number;          // (호환용 별칭) == maxSamples
  includeCafe?: boolean;      // 카페(CE7) 포함 여부 (기본 true)
  onProgress?: (done: number, total: number) => void; // 진행률 콜백
}

declare global { interface Window { kakao: any; } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

const toRad = (d: number) => d * (Math.PI / 180);
const haversine = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export function usePlacesAlongPath() {
  const [places, setPlaces]   = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const abortRef = useRef({ aborted: false });

  const reset = useCallback(() => {
    abortRef.current.aborted = true;
    setPlaces([]);
    setLoading(false);
    setError(null);
  }, []);

  const search = useCallback(async (path: LatLng[], opt?: SearchOptions) => {
    if (!kakao || !kakao.maps?.services || !Array.isArray(path) || path.length < 2) return;

    const stepMeters  = opt?.stepMeters ?? 150;     // 기본값 살짝 촘촘
    const radius      = opt?.radius ?? 350;         // 기본 반경 확대
    const maxSamples  = (opt?.maxSamples ?? opt?.maxTotal) ?? 200; // 샘플 상한
    const includeCafe = opt?.includeCafe ?? true;
    const catCodes = includeCafe ? ['FD6', 'CE7'] : ['FD6'];

    abortRef.current.aborted = false;
    setLoading(true);
    setError(null);
    setPlaces([]);

    try {
      // 1) 경로 샘플링
      const sampled: LatLng[] = [];
      let acc = 0;
      let prev = path[0];
      sampled.push(prev);
      for (let i = 1; i < path.length; i++) {
        const cur = path[i];
        const seg = haversine(prev, cur);
        acc += seg;
        if (acc >= stepMeters) {
          sampled.push(cur);
          acc = 0;
        }
        prev = cur;
      }
      if (sampled[sampled.length - 1] !== path[path.length - 1]) {
        sampled.push(path[path.length - 1]);
      }

      const quota = Math.min(sampled.length, maxSamples);
      const ps = new kakao.maps.services.Places();
      const results: Place[] = [];

      // id 우선 중복 제거
      const seenById = new Set<string>();
      const seenByKey = new Set<string>();
      const addIfNew = (p: Place) => {
        const keyById = p.id ? `id:${p.id}` : '';
        if (keyById) {
          if (seenById.has(keyById)) return;
          seenById.add(keyById);
        } else {
          const coarse = `${p.name}|${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
          if (seenByKey.has(coarse)) return;
          seenByKey.add(coarse);
        }
        results.push(p);
      };

      const searchOne = (center: kakao.maps.LatLng, code: string) => new Promise<Place[]>((resolve) => {
        // bounds 대신 location+radius 사용(반경 일관성 ↑)
        ps.categorySearch(
          code,
          (data: any[], status: string) => {
            if (status !== kakao.maps.services.Status.OK) { resolve([]); return; }
            const mapped = data.map((d) => ({
              id: d.id,
              name: d.place_name,
              lat: Number(d.y),
              lng: Number(d.x),
              address: d.address_name,
              roadAddress: d.road_address_name,
              phone: d.phone,
              category: d.category_name,
              category_group_code: d.category_group_code,
              category_name: d.category_name,
            })) as Place[];
            resolve(mapped);
          },
          { location: center, radius }
        );
      });

      for (let i = 0; i < quota; i++) {
        if (abortRef.current.aborted) break;

        const center = new kakao.maps.LatLng(sampled[i].lat, sampled[i].lng);
        for (const code of catCodes) {
          // eslint-disable-next-line no-await-in-loop
          const chunk = await searchOne(center, code);
          for (const p of chunk) addIfNew(p);
          if (abortRef.current.aborted) break;
        }

        opt?.onProgress?.(i + 1, quota);

        // QPS 방지
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 20));
      }

      if (!abortRef.current.aborted) {
        setPlaces(results);
      }
    } catch {
      if (!abortRef.current.aborted) setError('경로 주변 맛집을 불러오지 못했습니다.');
    } finally {
      if (!abortRef.current.aborted) setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    places, loading, error, search, reset
  }), [places, loading, error, search, reset]);
}

export default usePlacesAlongPath;
