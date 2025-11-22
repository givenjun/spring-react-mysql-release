// src/utils/index.ts

export const convertUrlToFile = async (url: string) => {
  const response = await fetch(url);
  const data = await response.blob();
  const extend = url.split(".").pop();
  const fileName = url.split("/").pop();
  const meta = { type: `image/${extend}` };

  return new File([data], fileName as string, meta);
};

export const convertUrlsToFile = async (urls: string[]) => {
  const files: File[] = [];
  for (const url of urls) {
    const file = await convertUrlToFile(url);
    files.push(file);
  }
  return files;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

// ----------------------
// 거리 계산 / 정렬 유틸
// ----------------------

// 위도/경도(degree)를 radian으로 변환
const toRad = (deg: number): number => (deg * Math.PI) / 180;

// 두 위경도 좌표 사이 거리(m) 계산 (Haversine 공식)
export const getDistanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // 지구 반지름 (m)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meter
};

// Kakao place 형태(x: lng, y: lat)를 기준 좌표에서 거리순으로 정렬
export type KakaoPlaceLike = {
  x: string; // 경도
  y: string; // 위도
  [key: string]: any;
};

export const sortPlacesByDistance = <T extends KakaoPlaceLike>(
  places: T[],
  centerLat: number,
  centerLng: number
): T[] => {
  return [...places].sort((a, b) => {
    const distA = getDistanceMeters(
      centerLat,
      centerLng,
      Number(a.y),
      Number(a.x)
    );
    const distB = getDistanceMeters(
      centerLat,
      centerLng,
      Number(b.y),
      Number(b.x)
    );
    return distA - distB; // 가까운 순
  });
};

// 출발지/도착지 기준 선택용 타입
export type DistanceBase = "origin" | "destination";

export type LatLng = { lat: number; lng: number };

// 출발지/도착지/폴백 좌표 중에서 거리 계산 기준점 선택
export const getDistanceBasePoint = (
  distanceBase: DistanceBase,
  origin: LatLng | null | undefined,
  destination: LatLng | null | undefined,
  fallback?: LatLng
): LatLng | null => {
  if (distanceBase === "origin" && origin) return origin;
  if (distanceBase === "destination" && destination) return destination;
  return fallback ?? null;
};
