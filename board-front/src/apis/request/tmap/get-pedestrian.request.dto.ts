// board-front/src/apis/request/tmap/get-pedestrian.request.dto.ts
export type LatLng = { lat: number; lng: number };

export interface GetPedestrianRouteRequest {
  start: LatLng;
  end: LatLng;

  viaPoints?: {lat:number; lng:number}[]; // 경유지(대안 경로 생성용)
}
