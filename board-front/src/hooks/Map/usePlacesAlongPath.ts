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

  // ✅ 추가: 필요할 때만 더 조여서/넓혀서 찾기
  keywords?: string[];              // 주변 키워드 검색(예: '족발','보쌈' 등)
  categoryGroupCodes?: string[];    // 기본 ['FD6','CE7'] 대신 강제 지정
  limit?: number;                   // 결과 상한 (안전장치)

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

    const stepMeters  = opt?.stepMeters ?? 150;     // 기본: 살짝 촘촘
    const radius      = opt?.radius ?? 350;         // 기본: 보통
    const maxSamples  = (opt?.maxSamples ?? opt?.maxTotal) ?? 200;
    const includeCafe = opt?.includeCafe ?? true;

    // ✅ 우선순위: 명시 categoryGroupCodes > includeCafe 기본 로직
    const catCodes = (opt?.categoryGroupCodes && opt.categoryGroupCodes.length > 0)
      ? opt.categoryGroupCodes
      : (includeCafe ? ['FD6','CE7'] : ['FD6']);

    const keywords = opt?.keywords ?? [];
    const limit = opt?.limit ?? 200; // 안전 상한

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
        if (results.length >= limit) return; // 상한
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

      const mapPlace = (d: any): Place => ({
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
      });

      const categorySearch = (center: kakao.maps.LatLng, code: string) =>
        new Promise<Place[]>((resolve) => {
          ps.categorySearch(
            code,
            (data: any[], status: string) => {
              if (status !== kakao.maps.services.Status.OK) { resolve([]); return; }
              resolve(data.map(mapPlace));
            },
            { location: center, radius }
          );
        });

      // ✅ 추가: 키워드 검색(이름/카테고리 텍스트)
      const keywordSearch = (center: kakao.maps.LatLng, q: string) =>
        new Promise<Place[]>((resolve) => {
          ps.keywordSearch(
            q,
            (data: any[], status: string) => {
              if (status !== kakao.maps.services.Status.OK) { resolve([]); return; }
              resolve(data.map(mapPlace));
            },
            { location: center, radius }
          );
        });

      for (let i = 0; i < quota; i++) {
        if (abortRef.current.aborted) break;
        if (results.length >= limit) break;

        const center = new kakao.maps.LatLng(sampled[i].lat, sampled[i].lng);

        // 2-a) 카테고리 검색
        for (const code of catCodes) {
          // eslint-disable-next-line no-await-in-loop
          const chunk = await categorySearch(center, code);
          for (const p of chunk) { if (results.length < limit) addIfNew(p); else break; }
          if (abortRef.current.aborted || results.length >= limit) break;
        }
        if (abortRef.current.aborted || results.length >= limit) break;

        // 2-b) (옵션) 키워드 검색
        if (keywords.length > 0) {
          for (const q of keywords) {
            // eslint-disable-next-line no-await-in-loop
            const chunk = await keywordSearch(center, q);
            for (const p of chunk) { if (results.length < limit) addIfNew(p); else break; }
            if (abortRef.current.aborted || results.length >= limit) break;
          }
        }

        opt?.onProgress?.(i + 1, quota);

        // QPS 방지
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 20));
      }

      if (!abortRef.current.aborted) setPlaces(results);
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
