// src/hooks/Map/useKakaoSearch.hock.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';

declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

export interface Place {
  id: string;
  place_name: string;
  x: string;
  y: string;
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;
}

interface AiSearchState {
  aiSearchResults: Place[];
  setAiSearchResults: (results: Place[]) => void;
}
export const useAiSearchStore = create<AiSearchState>((set) => ({
  aiSearchResults: [],
  setAiSearchResults: (results) => set({ aiSearchResults: results }),
}));

type SearchOptions = {
  center?: { lat: number; lng: number };     // 검색 중심
  radius?: number;                            // m (카카오 최대 1000)
  categoryGroupCodes?: string[];              // 예: ['FD6'] 음식점, ['FD6','CE7'] 음식+카페
  limit?: number;                             // 결과 상한
};

export default function useKakaoSearch() {
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [bounds, setBounds] = useState<kakao.maps.LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { aiSearchResults } = useAiSearchStore();

  // 내부 캐시 및 요청 버전(취소 토큰 역할)
  const cacheRef = useRef<Map<string, Place[]>>(new Map());
  const verRef = useRef(0);

  useEffect(() => {
    if (aiSearchResults.length > 0) {
      setSearchResults(aiSearchResults);
      const firstPlace = aiSearchResults[0];
      setCenter({ lat: parseFloat(firstPlace.y), lng: parseFloat(firstPlace.x) });
    }
  }, [aiSearchResults]);

  const makeKey = (keyword: string, opt?: SearchOptions) => {
    const k = (keyword || '').trim().toLowerCase();
    const c = opt?.center ? `${opt.center.lat.toFixed(5)},${opt.center.lng.toFixed(5)}` : 'no-center';
    const r = opt?.radius ?? 0;
    const cg = (opt?.categoryGroupCodes || []).filter((s): s is string => typeof s === 'string' && s.length > 0);
    const L = opt?.limit ?? 15;
    return JSON.stringify({ k, c, r, cg, L });
  };

  /**
   * 키워드로 장소를 검색합니다. (디폴트: 기존 동작과 동일)
   * options로 중심/반경/카테고리/상한을 줄 수 있음.
   * 캐시 + 최신 요청만 반영 + 결과 상한 적용.
   */
  const searchPlaces = (
    keyword: string,
    onSuccess?: (results: Place[]) => void,
    onError?: () => void,
    options?: SearchOptions
  ) => {
    if (!window.kakao?.maps?.services) {
      console.warn('Kakao Maps SDK not loaded.');
      onError?.();
      return;
    }

    const key = makeKey(keyword, options);
    const cached = cacheRef.current.get(key);
    if (cached) {
      // 캐시 히트시 즉시 반영
      const limited = (options?.limit ? cached.slice(0, options.limit) : cached);
      setSearchResults(limited);
      if (limited.length > 0) {
        const first = limited[0];
        setCenter({ lat: parseFloat(first.y), lng: parseFloat(first.x) });
        const newBounds = new window.kakao.maps.LatLngBounds();
        limited.forEach(p => newBounds.extend(new window.kakao.maps.LatLng(p.y, p.x)));
        setBounds(newBounds);
      }
      onSuccess?.(limited);
      return;
    }

    setIsLoading(true);
    const ps = new window.kakao.maps.services.Places();
    const ver = ++verRef.current;

    const cb = (data: any[], status: kakao.maps.services.Status) => {
      if (ver !== verRef.current) return; // 구 요청 무시
      setIsLoading(false);

      if (status === kakao.maps.services.Status.OK && data.length > 0) {
        const list: Place[] = data.map((d: any) => ({
          id: d.id, place_name: d.place_name, x: d.x, y: d.y,
          address_name: d.address_name, road_address_name: d.road_address_name,
          phone: d.phone, category_name: d.category_name,
        }));
        const limited = (options?.limit ? list.slice(0, options.limit) : list);

        cacheRef.current.set(key, list);
        setSearchResults(limited);

        const first = limited[0];
        setCenter({ lat: parseFloat(first.y), lng: parseFloat(first.x) });

        const newBounds = new window.kakao.maps.LatLngBounds();
        limited.forEach(place => newBounds.extend(new window.kakao.maps.LatLng(place.y, place.x)));
        setBounds(newBounds);

        onSuccess?.(limited);
      } else {
        setSearchResults([]);
        onError?.();
      }
    };

    const searchOpts: any = {};
    if (options?.center && (options.radius ?? 0) > 0) {
      searchOpts.location = new window.kakao.maps.LatLng(options.center.lat, options.center.lng);
      searchOpts.radius = Math.min(1000, Math.max(1, options.radius!));
    }

    // 카테고리 그룹코드가 있으면 우선 카테고리로 스캔 후, 필요 시 키워드 보강
    const cg = (options?.categoryGroupCodes || []).filter((s): s is string => typeof s === 'string' && s.length > 0);
    if (cg.length > 0) {
      let acc: any[] = [];
      let remain = options?.limit ?? 15;

      const doCategory = (idx: number) => {
        if (idx >= cg.length) {
          if (acc.length < (options?.limit ?? 15)) {
            // 보강: 키워드
            ps.keywordSearch(keyword, (data: any[], status: any) => {
              if (ver !== verRef.current) return;
              if (status === kakao.maps.services.Status.OK) acc = acc.concat(data);
              cb(acc, kakao.maps.services.Status.OK);
            }, searchOpts);
          } else {
            cb(acc, kakao.maps.services.Status.OK);
          }
          return;
        }
        ps.categorySearch(cg[idx], (data: any[], status: any) => {
          if (ver !== verRef.current) return;
          if (status === kakao.maps.services.Status.OK) acc = acc.concat(data.slice(0, remain));
          remain = (options?.limit ?? 15) - acc.length;
          if (remain <= 0) { cb(acc, kakao.maps.services.Status.OK); return; }
          doCategory(idx + 1);
        }, searchOpts);
      };
      doCategory(0);
    } else {
      ps.keywordSearch(keyword, cb, searchOpts);
    }
  };

  return {
    searchResults,
    center,
    bounds,
    isLoading,
    hoveredIndex,
    setHoveredIndex,
    searchPlaces,
  };
}
