// src/components/Map/RouteOverlay/index.tsx
import React, { useMemo, useState } from "react";
import { Map, Polyline, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import type { LatLng } from "apis/request/tmap";
import type { Place } from "hooks/Map/usePlacesAlongPath";

declare global {
  interface Window { kakao: any; }
}

interface Props {
  center: { lat: number; lng: number };
  level?: number;
  path: LatLng[];
  places: Place[];
  onMapCreated?: (map: kakao.maps.Map) => void;
}

export default function RouteOverlay({ center, level = 4, path, places, onMapCreated }: Props) {
  const [focused, setFocused] = useState<Place | null>(null);

  const linePath = useMemo(() => path.map((p) => ({ lat: p.lat, lng: p.lng })), [path]);

  return (
    <Map center={center} level={level} style={{ width: "100%", height: "100%" }} onCreate={onMapCreated}>
      {linePath.length >= 2 && (
        <Polyline path={[linePath]} strokeWeight={6} strokeOpacity={0.9} strokeColor="#7b5cff" />
      )}

      {places.map((pl) => (
        <MapMarker key={pl.id} position={{ lat: pl.lat, lng: pl.lng }} onClick={() => setFocused(pl)} />
      ))}

      {focused && (
        <CustomOverlayMap position={{ lat: focused.lat, lng: focused.lng }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "8px 12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{focused.name}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {focused.roadAddress || focused.address}
            </div>
          </div>
        </CustomOverlayMap>
      )}
    </Map>
  );
}
