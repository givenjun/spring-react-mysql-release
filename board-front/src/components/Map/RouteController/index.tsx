// src/components/Map/RouteController/index.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import RouteOverlay from "components/Map/RouteOverlay";
import PlaceList from "components/Map/PlaceList";
import { useRoute } from "hooks/Map/useRoute";
import { usePlacesAlongPath, Place } from "hooks/Map/usePlacesAlongPath";

import type { LatLng } from "../../../apis/request/tmap";
import type { GetPedestrianRouteRequest } from "../../../apis/request/tmap";

declare global {
  interface Window { kakao: any; }
}

type Coords = LatLng;

// 한밭대(필요하면 상수 파일로 이동)
const HANBAT: Coords = { lat: 36.351, lng: 127.300 };

interface Props {
  defaultCenter?: Coords;
  // 기존 SearchSidebar를 주입. onConfirm(req)만 호출해주면 됩니다.
  SearchSidebar?: React.ComponentType<{ onConfirm: (req: GetPedestrianRouteRequest) => void; }>;
  onRouteConfirmed?: (req: GetPedestrianRouteRequest) => void;
}

export default function RouteController({
  defaultCenter = HANBAT,
  SearchSidebar,
  onRouteConfirmed,
}: Props) {
  const mapRef = useRef<kakao.maps.Map | null>(null);

  const [start, setStart] = useState<Coords | null>(null);
  const [end, setEnd] = useState<Coords | null>(null);

  const {
    loading: routeLoading,
    path,
    totalDistance,
    totalTime,
    error: routeError,
    fetch,
    clear,
  } = useRoute();

  const {
    loading: placeLoading,
    places,
    error: placeError,
    search,
    reset,
  } = usePlacesAlongPath();

  const handleMapCreated = (map: kakao.maps.Map) => { mapRef.current = map; };

  const onConfirm = useCallback(async (req: GetPedestrianRouteRequest) => {
    reset();
    await fetch(req);
    onRouteConfirmed?.(req);

    // (선택) UI 표시용으로 시작/끝 저장하고 싶다면 사용
    // if ("startLat" in req && "startLng" in req && "endLat" in req && "endLng" in req) {
    //   setStart({ lat: req.startLat, lng: req.startLng });
    //   setEnd({ lat: req.endLat, lng: req.endLng });
    // }
  }, [fetch, onRouteConfirmed, reset]);

  const afterRoute = useMemo(() => path && path.length > 1, [path]);

  const doSearchPlaces = useCallback(async () => {
    if (!afterRoute) return;
    await search(path, { stepMeters: 250, radius: 200, maxPerStep: 5 });
  }, [afterRoute, path, search]);

  const focusPlace = (p: Place) => {
    if (!mapRef.current) return;
    mapRef.current.setLevel(3);
    mapRef.current.panTo(new window.kakao.maps.LatLng(p.lat, p.lng));
  };

  const mapCenter: Coords = useMemo(() => {
    if (!afterRoute) return defaultCenter;
    const mid = path[Math.floor(path.length / 2)];
    return { lat: mid.lat, lng: mid.lng };
  }, [afterRoute, defaultCenter, path]);

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

        {placeLoading && <div style={{ marginTop:8 }}>맛집 검색 중…</div>}
        {placeError && <div style={{ color:"red" }}>{placeError}</div>}

        <PlaceList places={places} onFocusPlace={focusPlace} />
      </div>

      <div style={{ position:"relative" }}>
        <RouteOverlay
          center={mapCenter}
          path={path}
          places={places}
          onMapCreated={handleMapCreated}
        />
      </div>
    </div>
  );
}
