import { useEffect, useState } from 'react';
import { create } from 'zustand';

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
  setAiSearchResults: (results) => set({ aiSearchResults: results}),
}));

export default function useKakaoSearch() {
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [bounds, setBounds] = useState<kakao.maps.LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);  // ✅ 마커 hover용 index

  const { aiSearchResults } = useAiSearchStore();

  useEffect(() => {
    if (aiSearchResults.length > 0) {
      setSearchResults(aiSearchResults);
      const firstPlace = aiSearchResults[0];
      setCenter({ lat: parseFloat(firstPlace.y), lng: parseFloat(firstPlace.x) });
    }
  }, [aiSearchResults]);
  /**
   * 키워드로 장소를 검색합니다.
   */
  const searchPlaces = (
    keyword: string,
    onSuccess?: (results: Place[]) => void,
    onError?: () => void
  ) => {
    if (!window.kakao?.maps?.services) {
      console.warn('Kakao Maps SDK not loaded.');
      onError?.();
      return;
    }

    setIsLoading(true);
    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data: any[], status: kakao.maps.services.Status) => {
      setIsLoading(false);

      if (status === kakao.maps.services.Status.OK && data.length > 0) {
        const newBounds = new window.kakao.maps.LatLngBounds();

        data.forEach(place => {
          newBounds.extend(new window.kakao.maps.LatLng(place.y, place.x));
        });

        setSearchResults(data);
        setCenter({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
        setBounds(newBounds);
        onSuccess?.(data);
      } else {
        setSearchResults([]);
        onError?.();
      }
    });
  };

  return {
    searchResults,
    center,
    bounds,
    isLoading,
    hoveredIndex,
    setHoveredIndex,   // ✅ 외부에서 hover 제어 가능하도록 export
    searchPlaces,
  };
}
