// board-front/src/apis/tmap.ts
import type { GetPedestrianRouteRequest, LatLng } from './request/tmap/index';
import type { TmapGeoJSON, TmapRoute } from './response/tmap/index';

export async function getPedestrianRoute(req: GetPedestrianRouteRequest): Promise<TmapRoute> {
  const res = await fetch('http://127.0.0.1:4000/api/tmap/pedestrian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tmap route error: ${res.status} ${text}`);
  }

  const data: TmapGeoJSON = await res.json();

  const path: LatLng[] = [];
  let totalDistance: number | undefined;
  let totalTime: number | undefined;

  for (const f of data.features || []) {
    // 좌표계는 [lng, lat] 순
    if (f.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)) {
      for (const [lng, lat] of f.geometry.coordinates as number[][]) {
        path.push({ lat, lng });
      }
    }
    if (f.properties?.totalDistance) totalDistance = f.properties.totalDistance;
    if (f.properties?.totalTime) totalTime = f.properties.totalTime;
  }

  return { path, totalDistance, totalTime };
}
