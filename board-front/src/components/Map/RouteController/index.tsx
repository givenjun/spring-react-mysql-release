// src/components/Map/RouteController/index.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import RouteOverlay from "components/Map/RouteOverlay";
import PlaceList, { PlaceItem } from "components/Map/PlaceList";
import { useRoute } from "hooks/Map/useRoute";
import usePlacesAlongPath  from "hooks/Map/usePlacesAlongPath";
import type { LatLng, GetPedestrianRouteRequest } from "../../../apis/request/tmap";

declare global { interface Window { kakao: any; } }

type Coords = LatLng;
const HANBAT: Coords = { lat: 36.351, lng: 127.300 };

interface Props {
  defaultCenter?: Coords;
  SearchSidebar?: React.ComponentType<{ onConfirm: (req: GetPedestrianRouteRequest) => void; }>;
  onRouteConfirmed?: (req: GetPedestrianRouteRequest) => void;
  routeColor?: string; // 경로 색상 주입 가능
}

/* ===== 경로 길이 기반 가변 옵션 유틸 ===== */
type LL = { lat: number; lng: number };
const toRad = (d: number) => d * Math.PI / 180;
const segKm = (a: LL, b: LL) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const A = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(A));
};
const pathLengthKm = (path: LL[]) =>
  path.reduce((s, _, i) => (i ? s + segKm(path[i-1], path[i]) : 0), 0);

/** 경로 길이에 따라 stepMeters / radius / maxTotal 자동 결정 */
function getAdaptivePlacesOptions(path: LL[]) {
  const L = pathLengthKm(path);                  // km
  const radius = L < 2 ? 350 : L < 6 ? 250 : 180;    // m (짧은 경로일수록 넓게)
  const minSteps = 8;                                // 짧아도 최소 스텝 보장
  const approxStep = Math.max(120, Math.round(radius * 0.9)); // m
  const steps = Math.max(minSteps, Math.ceil((L * 1000) / approxStep));
  const stepMeters = Math.max(80, Math.floor((L * 1000) / steps));
  const maxTotal = L < 2 ? 140 : L < 6 ? 180 : 200;  // 전체 상한 가변

  return { stepMeters, radius, maxTotal, includeCafe: true, mode: "full" } as const;
}

export default function RouteController({
  defaultCenter = HANBAT,
  SearchSidebar,
  onRouteConfirmed,
  routeColor = '#8a2ea1',
}: Props) {
  const mapRef = useRef<kakao.maps.Map | null>(null);

  // 출발/도착 좌표를 저장해 두면, 맛집 더블클릭 시 "출발 → 맛집" 경로 생성 가능
  const [startLL, setStartLL] = useState<Coords | null>(null);
  const [endLL, setEndLL] = useState<Coords | null>(null);

  // 경로 상태
  const {
    loading: routeLoading,
    path,
    totalDistance,
    totalTime,
    error: routeError,
    fetch,
  } = useRoute();

  // 경로 주변 맛집
  const {
    loading: placeLoading,
    places,
    error: placeError,
    search,
    reset,
  } = usePlacesAlongPath();

  // 지도 생성 시 mapRef에 보관
  const handleMapCreated = (map: kakao.maps.Map) => { mapRef.current = map; };

  // 단일 클릭 지연 판정을 위한 타이머
  const clickTimerRef = useRef<number | null>(null);
  const CLICK_DELAY_MS = 280; // 더블클릭보다 약간 크게

  // 맵 중심 "잠금" 장치: 경로가 갱신되며 Map의 center가 튀는 것을 방지
  const [centerLock, setCenterLock] = useState<{ lat: number; lng: number } | null>(null);

  // 사이드바에서 출발/도착 확정 시: 기존 맛집 결과 초기화 + 경로 fetch + 출발/도착 저장 + 중심 잠금 해제
  const onConfirm = useCallback(async (req: GetPedestrianRouteRequest) => {
    reset();
    // 요청 객체에 좌표 필드가 있다면 저장 (필드명이 다르면 프로젝트 스키마에 맞춰 수정)
    const sLat = (req as any)?.startLat ?? (req as any)?.start?.lat;
    const sLng = (req as any)?.startLng ?? (req as any)?.start?.lng;
    const eLat = (req as any)?.endLat ?? (req as any)?.end?.lat;
    const eLng = (req as any)?.endLng ?? (req as any)?.end?.lng;
    if (typeof sLat === 'number' && typeof sLng === 'number') setStartLL({ lat: sLat, lng: sLng });
    if (typeof eLat === 'number' && typeof eLng === 'number') setEndLL({ lat: eLat, lng: eLng });

    // 새로운 경로로 갱신할 때는 중심 잠금을 풀어 Map이 자연스럽게 동작하게
    setCenterLock(null);

    await fetch(req);
    onRouteConfirmed?.(req);
  }, [fetch, onRouteConfirmed, reset]);

  const afterRoute = useMemo(() => path && path.length > 1, [path]);

  // 맛집 검색
  const doSearchPlaces = useCallback(async () => {
    if (!afterRoute) return;
    // removed: 고정 옵션(stepMeters/radius/maxTotal)
    // await search(path, { stepMeters: 150, radius: 350, maxTotal: 600, includeCafe: true });
    const opts = getAdaptivePlacesOptions(path as LL[]);
    await search(path, opts);
  }, [afterRoute, path, search]);

  // 유틸
  const toNumber = (v: number | string | undefined): number =>
    (typeof v === 'string' ? parseFloat(v) : (v ?? NaN));

  // 부드러운 이동
  const smoothPanTo = useCallback((lat: number, lng: number, targetLevel = 3) => {
    const m = mapRef.current;
    if (!m || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const pos = new window.kakao.maps.LatLng(lat, lng);
    try {
      const curLevel = (m as any).getLevel?.() ?? 4;
      if (curLevel > targetLevel) {
        (m as any).setLevel(targetLevel, { animate: true });
        setTimeout(() => (m as any).panTo(pos), 120);
      } else {
        (m as any).panTo(pos);
      }
    } catch {
      (m as any).panTo(pos);
    }
  }, []);

  // ✅ 리스트 "단일 클릭": 바로 이동하지 않음 — 일정 시간 대기 후 이동 (더블클릭이 들어오면 취소)
  const handlePlaceSingleClick = useCallback((p: PlaceItem) => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      const lat = toNumber(p.lat);
      const lng = toNumber(p.lng);
      smoothPanTo(lat, lng, 3);
    }, CLICK_DELAY_MS) as unknown as number;
  }, [smoothPanTo]);

  // ✅ 리스트 "더블클릭": 단일 클릭 예약 취소 → 즉시 이동 + 경로 생성
  //    경로 생성으로 path가 바뀌어도 Map center가 튀지 않도록, 클릭 지점으로 centerLock을 걸어둠
  const handlePlaceDoubleClick = useCallback(async (p: PlaceItem) => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }

    const lat = toNumber(p.lat);
    const lng = toNumber(p.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // (1) 즉시 부드러운 이동
    smoothPanTo(lat, lng, 3);

    // (2) 중심 잠금(경로 갱신 시 center 점프 방지)
    setCenterLock({ lat, lng });

    // (3) 출발지가 있어야 경로 생성 가능
    if (startLL) {
      const req: any = {
        startLat: startLL.lat,
        startLng: startLL.lng,
        endLat: lat,
        endLng: lng,
      };
      try {
        await fetch(req);
      } finally {
        // 잠금은 약간의 시간차 후 해제 (줌/팬 애니메이션과 경합 방지)
        setTimeout(() => setCenterLock(null), 300);
      }
    } else {
      // 출발지가 없으면 잠금만 잠깐 유지 후 해제
      setTimeout(() => setCenterLock(null), 300);
    }
  }, [fetch, smoothPanTo, startLL]);

  // Map center 결정: 잠금이 있으면 잠금 좌표, 아니면 기존 로직(경로 중간점 or 기본센터)
  const mapCenter: Coords = useMemo(() => {
    if (centerLock) return centerLock;
    if (!afterRoute) return defaultCenter;
    const mid = path[Math.floor(path.length / 2)];
    return { lat: mid.lat, lng: mid.lng };
  }, [afterRoute, defaultCenter, path, centerLock]);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:"12px", height:"calc(100vh - 120px)" }}>
      <div style={{ overflowY:"auto", paddingRight:8 }}>
        {SearchSidebar && <SearchSidebar onConfirm={onConfirm} />}

        {routeLoading && <div>경로 불러오는 중…</div>}
        {routeError && <div style={{ color:"red" }}>{routeError}</div>}

        {afterRoute && (
          <div style={{ marginTop:10, fontSize:14 }}>
            <div>총거리: {(totalDistance/1000).toFixed(2)} km · 예상 {Math.round((totalTime ?? 0)/60)}분</div>
            <button
              onClick={doSearchPlaces}
              style={{ marginTop:8, padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer" }}
            >
              경로 주변 맛집 불러오기
            </button>
          </div>
        )}

        {placeError && <div style={{ color:"red", marginTop:8 }}>{placeError}</div>}

        <div style={{ height: 'calc(100vh - 320px)' }}>
          <PlaceList
            places={places as unknown as PlaceItem[]}
            isLoading={placeLoading}
            hiddenWhileLoading={true}
            onItemClick={handlePlaceSingleClick}       // 단일 클릭: 지연 이동(더블클릭 시 취소)
            onItemDoubleClick={handlePlaceDoubleClick} // 더블클릭: 이동 + 경로 생성
          />
        </div>
      </div>

      <div style={{ position:"relative" }}>
        <RouteOverlay
          center={mapCenter}
          path={path}
          places={places as any}
          onMapCreated={handleMapCreated}
          routeColor={routeColor}
        />
      </div>
    </div>
  );
}
