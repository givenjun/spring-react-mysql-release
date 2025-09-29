// src/hooks/Map/useRoute.ts
import { useCallback, useState } from "react";
import { getPedestrianRoute } from "../../apis/tmap";
import type { GetPedestrianRouteRequest, LatLng } from "../../apis/request/tmap";
import type { TmapRoute } from "../../apis/response/tmap";

export function useRoute() {
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<LatLng[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (req: GetPedestrianRouteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res: TmapRoute = await getPedestrianRoute(req);
      setPath(res.path ?? []);
      setTotalDistance(res.totalDistance ?? 0);
      setTotalTime(res.totalTime ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "경로 요청 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPath([]);
    setTotalDistance(0);
    setTotalTime(0);
    setError(null);
  }, []);

  return { loading, path, totalDistance, totalTime, error, fetch, clear };
}
