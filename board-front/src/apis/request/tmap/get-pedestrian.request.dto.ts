// board-front/src/apis/request/tmap/get-pedestrian.request.dto.ts
export type LatLng = { lat: number; lng: number };

export interface GetPedestrianRouteRequest {
  start: LatLng;
  end: LatLng;
}
