// src/hooks/Map/useKakaoSearch.hook.ts
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

declare global { interface Window { kakao: any } }
const kakao = (typeof window !== 'undefined' ? (window as any).kakao : undefined);

export interface Place {
  id: string;
  place_name: string;
  x: string; // lng
  y: string; // lat
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;

  /** 🔥 음식점/카페 등 그룹 코드/이름 */
  category_group_code?: string;   // FD6, CE7 …
  category_group_name?: string;   // 음식점, 카페 …

  /** 🔥 카카오 상세 페이지 URL */
  place_url?: string;
  placeUrl?: string;
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
  center?: { lat: number; lng: number }; // 검색 중심
  radius?: number;                        // m (카카오 최대 1000)
  categoryGroupCodes?: string[];          // ['FD6'], ['FD6','CE7'] 등
  limit?: number;                         // 결과 상한
};

export default function useKakaoSearch() {
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [bounds, setBounds] = useState<kakao.maps.LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { aiSearchResults } = useAiSearchStore();

  // 내부 캐시 및 버전 토큰(구 요청 무시)
  const cacheRef = useRef<Map<string, Place[]>>(new Map());
  const verRef = useRef(0);

  useEffect(() => {
    if (aiSearchResults.length > 0) {
      setSearchResults(aiSearchResults);
      const f = aiSearchResults[0];
      setCenter({ lat: parseFloat(f.y), lng: parseFloat(f.x) });
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

  /** 탐색 탭: 상태를 바꾸는 일반 검색 */
  const searchPlaces = (
    keyword: string,
    onSuccess?: (results: Place[]) => void,
    onError?: () => void,
    options?: SearchOptions
  ) => {
    if (!window.kakao?.maps?.services) { onError?.(); return; }

    const key = makeKey(keyword, options);
    const cached = cacheRef.current.get(key);
    if (cached) {
      const limited = options?.limit ? cached.slice(0, options.limit) : cached;
      setSearchResults(limited);
      if (limited.length > 0) {
        const f = limited[0];
        setCenter({ lat: parseFloat(f.y), lng: parseFloat(f.x) });
        const b = new window.kakao.maps.LatLngBounds();
        limited.forEach(p => b.extend(new window.kakao.maps.LatLng(p.y, p.x)));
        setBounds(b);
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
          id: d.id,
          place_name: d.place_name,
          x: d.x,
          y: d.y,
          address_name: d.address_name,
          road_address_name: d.road_address_name,
          phone: d.phone,
          category_name: d.category_name,
          /** 🔥 그룹 코드/이름도 같이 저장 */
          category_group_code: d.category_group_code,
          category_group_name: d.category_group_name,
          /** 🔥 카카오 place URL */
          place_url: d.place_url,
          placeUrl: d.place_url,
        }));
        const limited = options?.limit ? list.slice(0, options.limit) : list;

        cacheRef.current.set(key, list);
        setSearchResults(limited);

        const f = limited[0];
        setCenter({ lat: parseFloat(f.y), lng: parseFloat(f.x) });

        const b = new window.kakao.maps.LatLngBounds();
        limited.forEach(p => b.extend(new window.kakao.maps.LatLng(p.y, p.x)));
        setBounds(b);

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

    const cg = (options?.categoryGroupCodes || []).filter((s): s is string => typeof s === 'string' && s.length > 0);
    if (cg.length > 0) {
      let acc: any[] = [];
      let remain = options?.limit ?? 15;

      const doCategory = (idx: number) => {
        if (idx >= cg.length) {
          if (acc.length < (options?.limit ?? 15)) {
            ps.keywordSearch(keyword, (data: any[], status: any) => {
              if (ver !== verRef.current) return;
              if (status === kakao.maps.services.Status.OK) acc = acc.concat(data);
              cb(acc, kakao.maps.services.Status.OK);
            }, searchOpts);
          } else cb(acc, kakao.maps.services.Status.OK);
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

  /** 길찾기 탭: 엔터 시 ‘최상위 1개’만 필요할 때 */
  const searchOnce = (keyword: string, options?: SearchOptions): Promise<Place[]> => {
    return new Promise<Place[]>((resolve) => {
      if (!window.kakao?.maps?.services) return resolve([]);
      const q = (keyword || '').trim();
      if (q.length < 2) return resolve([]);

      const ps = new window.kakao.maps.services.Places();
      const searchOpts: any = {};
      if (options?.center && (options.radius ?? 0) > 0) {
        searchOpts.location = new window.kakao.maps.LatLng(options.center.lat, options.center.lng);
        searchOpts.radius = Math.min(1000, Math.max(1, options.radius!));
      }

      ps.keywordSearch(q, (data: any[], status: kakao.maps.services.Status) => {
        if (status !== kakao.maps.services.Status.OK || !data?.length) return resolve([]);
        const list: Place[] = data.map((d: any) => ({
          id: d.id,
          place_name: d.place_name,
          x: d.x,
          y: d.y,
          address_name: d.address_name,
          road_address_name: d.road_address_name,
          phone: d.phone,
          category_name: d.category_name,
          category_group_code: d.category_group_code,
          category_group_name: d.category_group_name,
          place_url: d.place_url,
          placeUrl: d.place_url,
        }));
        resolve(options?.limit ? list.slice(0, options.limit) : list);
      }, searchOpts);
    });
  };

  /** 길찾기 탭: 엔터 시 ‘리스트를 띄울’ 때 */
  const searchManyOnce = (keyword: string, limit = 12, options?: SearchOptions): Promise<Place[]> => {
    return new Promise<Place[]>((resolve) => {
      if (!window.kakao?.maps?.services) return resolve([]);
      const q = (keyword || '').trim();
      if (q.length < 2) return resolve([]);

      const ps = new window.kakao.maps.services.Places();
      const searchOpts: any = {};
      if (options?.center && (options.radius ?? 0) > 0) {
        searchOpts.location = new window.kakao.maps.LatLng(options.center.lat, options.center.lng);
        searchOpts.radius = Math.min(1000, Math.max(1, options.radius!));
      }

      ps.keywordSearch(q, (data: any[], status: kakao.maps.services.Status) => {
        if (status !== kakao.maps.services.Status.OK || !data?.length) return resolve([]);
        const list: Place[] = data.map((d: any) => ({
          id: d.id,
          place_name: d.place_name,
          x: d.x,
          y: d.y,
          address_name: d.address_name,
          road_address_name: d.road_address_name,
          phone: d.phone,
          category_name: d.category_name,
          category_group_code: d.category_group_code,
          category_group_name: d.category_group_name,
          place_url: d.place_url,
          placeUrl: d.place_url,
        }));
        resolve(list.slice(0, limit));
      }, searchOpts);
    });
  };

  return {
    // 상태형(탐색 탭)
    searchResults,
    center,
    bounds,
    isLoading,
    hoveredIndex,
    setHoveredIndex,
    searchPlaces,

    // 엔터형(길찾기 탭)
    searchOnce,
    searchManyOnce,
  };
}
