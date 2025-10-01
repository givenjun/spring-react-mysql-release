import React, { useEffect, useMemo, useRef, useState } from "react";
import { Polyline, MapMarker } from "react-kakao-maps-sdk";

type LatLng = { lat: number; lng: number };

interface AnimatedPolylineProps {
  path: LatLng[];                 // 전체 경로 (WGS84)
  speed?: number;                 // m/s 기준 이동 속도 (기본: 60m/s ≈ 느린 자동차)
  loop?: boolean;                 // 끝까지 가면 처음부터 반복할지
  showMarker?: boolean;           // 진행 마커 표시
  strokeColor?: string;           // 선 색
  strokeWeight?: number;          // 선 두께
  strokeOpacity?: number;         // 선 불투명도
  zIndex?: number;                // zIndex
}

/** 경로 누적거리 테이블 */
function buildCumulativeDist(path: LatLng[]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // m
  const dist = (a: LatLng, b: LatLng) => {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = dLng * Math.cos((lat1 + lat2) / 2);
    const y = dLat;
    return Math.sqrt(x * x + y * y) * R;
  };

  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    cum[i] = cum[i - 1] + dist(path[i - 1], path[i]);
  }
  return cum;
}

/** 거리 s에서의 좌표 보간 */
function interpolateAt(path: LatLng[], cum: number[], s: number): LatLng {
  if (s <= 0) return path[0];
  const total = cum[cum.length - 1];
  if (s >= total) return path[path.length - 1];

  // 이분 탐색
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cum[mid] < s) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const s0 = cum[i - 1], s1 = cum[i];
  const t = (s - s0) / (s1 - s0);
  const a = path[i - 1], b = path[i];
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export default function AnimatedPolyline({
  path,
  speed = 60,
  loop = true,
  showMarker = true,
  strokeColor = "#2E86DE",
  strokeWeight = 5,
  strokeOpacity = 0.9,
  zIndex = 5,
}: AnimatedPolylineProps) {
  const validPath = useMemo(
    () => path.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [path]
  );

  const cum = useMemo(() => (validPath.length > 1 ? buildCumulativeDist(validPath) : [0]), [validPath]);
  const total = cum[cum.length - 1] || 0;

  const [progress, setProgress] = useState(0); // m 단위 진행거리
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    // 경로 변경 시 초기화
    setProgress(0);
    lastTsRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (validPath.length < 2 || total <= 0) return;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // sec
      lastTsRef.current = ts;

      let next = progress + speed * dt;
      if (next >= total) {
        next = loop ? (next % total) : total;
      }
      setProgress(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPath, total, speed, loop]);

  if (validPath.length < 2) return null;

  // 현재 진행 지점 좌표
  const head = interpolateAt(validPath, cum, progress);

  // 현재까지 그릴 경로(머리 포함)
  const visiblePath = useMemo(() => {
    // cum 배열에서 progress 이하인 구간까지 잘라서 + head 추가
    const seg: LatLng[] = [];
    for (let i = 0; i < validPath.length; i++) {
      if (cum[i] <= progress) seg.push(validPath[i]);
      else break;
    }
    // head가 마지막 점과 다르면 추가
    const last = seg[seg.length - 1];
    if (!last || last.lat !== head.lat || last.lng !== head.lng) seg.push(head);
    return seg;
  }, [validPath, cum, progress, head]);

  return (
    <>
      <Polyline
        path={visiblePath}
        strokeColor={strokeColor}
        strokeWeight={strokeWeight}
        strokeOpacity={strokeOpacity}
        strokeStyle="solid"
        zIndex={zIndex}
      />
      {showMarker && (
        <MapMarker
          position={head}
          image={{
            src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
            size: { width: 24, height: 35 },
            options: { offset: { x: 12, y: 35 } },
          }}
        />
      )}
    </>
  );
}
