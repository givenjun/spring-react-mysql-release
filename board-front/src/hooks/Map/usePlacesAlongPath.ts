// src/hooks/Map/usePlacesAlongPath.ts
import { useCallback, useState } from "react";
import type { LatLng } from "../../apis/request/tmap";

declare global {
  interface Window { kakao: any; }
}

export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  roadAddress?: string;
  phone?: string;
  category?: string;
};

function haversine(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function usePlacesAlongPath() {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    path: LatLng[],
    options?: { stepMeters?: number; radius?: number; maxPerStep?: number; }
  ) => {
    if (!path?.length) return;
    if (!window.kakao?.maps?.services) {
      setError("카카오 SDK가 로드되지 않았습니다.");
      return;
    }

    const stepMeters = options?.stepMeters ?? 250;
    const radius = options?.radius ?? 200;
    const maxPerStep = options?.maxPerStep ?? 5;

    setLoading(true);
    setError(null);
    try {
      const services = new window.kakao.maps.services.Places();
      const unique = new Map<string, Place>();

      // 경로 샘플링
      const samples: LatLng[] = [];
      let acc = 0;
      for (let i = 0; i < path.length; i++) {
        if (samples.length === 0) { samples.push(path[i]); continue; }
        acc += haversine(samples[samples.length - 1], path[i]);
        if (acc >= stepMeters) { samples.push(path[i]); acc = 0; }
      }
      if (samples[samples.length - 1] !== path[path.length - 1]) {
        samples.push(path[path.length - 1]);
      }

      // 카테고리 검색(FD6: 음식점) — 순차 실행로 QPS 회피
      const queryStep = (center: LatLng) => new Promise<void>((resolve) => {
        services.categorySearch(
          "FD6",
          (res: any[], status: string) => {
            if (status === window.kakao.maps.services.Status.OK && Array.isArray(res)) {
              res.slice(0, maxPerStep).forEach((r) => {
                const id = String(r.id ?? `${r.place_url ?? ""}-${r.y}-${r.x}`);
                if (!unique.has(id)) {
                  unique.set(id, {
                    id,
                    name: r.place_name,
                    lat: parseFloat(r.y),
                    lng: parseFloat(r.x),
                    address: r.address_name,
                    roadAddress: r.road_address_name || undefined,
                    phone: r.phone || undefined,
                    category: r.category_name || undefined,
                  });
                }
              });
            }
            resolve();
          },
          { location: new window.kakao.maps.LatLng(center.lat, center.lng), radius }
        );
      });

      for (const s of samples) { // eslint-disable-next-line no-await-in-loop
        await queryStep(s);
      }

      setPlaces(Array.from(unique.values()));
    } catch (e: any) {
      setError(e?.message ?? "장소 검색 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPlaces([]);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, places, error, search, reset };
}
