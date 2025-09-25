// board-front/src/apis/response/tmap/get-pedestrian.response.dto.ts
import type { LatLng } from '../../request/tmap';

export type TmapFeature = {
  type: 'Feature';
  geometry?: {
    type: 'LineString' | 'Point' | 'MultiLineString';
    coordinates?: any;
  };
  properties?: Record<string, any>;
};

export type TmapGeoJSON = {
  type: 'FeatureCollection';
  features: TmapFeature[];
};

export type TmapRoute = {
  path: LatLng[];          // polyline 그릴 때 사용할 좌표 배열 (lat/lng)
  totalDistance?: number;  // m
  totalTime?: number;      // sec
};
