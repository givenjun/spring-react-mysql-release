// // src/components/Map/RouteOverlay/index.tsx
// import React, { useMemo, useState } from "react";
// import { Map, Polyline, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
// import type { LatLng } from "apis/request/tmap";
// import type { Place } from "hooks/Map/usePlacesAlongPath";

// declare global {
//   interface Window { kakao: any; }
// }

// interface Props {
//   center: { lat: number; lng: number };
//   level?: number;
//   path: LatLng[];
//   places: Place[];
//   onMapCreated?: (map: kakao.maps.Map) => void;
// }

// export default function RouteOverlay({ center, level = 4, path, places, onMapCreated }: Props) {
//   const [focused, setFocused] = useState<Place | null>(null);

//   const linePath = useMemo(() => path.map((p) => ({ lat: p.lat, lng: p.lng })), [path]);

//   return (
//     <Map center={center} level={level} style={{ width: "100%", height: "100%" }} onCreate={onMapCreated}>
//       {linePath.length >= 2 && (
//         <Polyline path={[linePath]} strokeWeight={6} strokeOpacity={0.9} strokeColor="#7b5cff" />
//       )}

//       {places.map((pl) => (
//         <MapMarker key={pl.id} position={{ lat: pl.lat, lng: pl.lng }} onClick={() => setFocused(pl)} />
//       ))}

//       {focused && (
//         <CustomOverlayMap position={{ lat: focused.lat, lng: focused.lng }}>
//           <div
//             style={{
//               background: "#fff",
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: "8px 12px",
//               boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
//             }}
//           >
//             <div style={{ fontWeight: 700, marginBottom: 4 }}>{focused.name}</div>
//             <div style={{ fontSize: 12, color: "#555" }}>
//               {focused.roadAddress || focused.address}
//             </div>
//           </div>
//         </CustomOverlayMap>
//       )}
//     </Map>
//   );
// }

// 경로 + 경로 주변 맛집 마커 + 클릭 시 라벨 표시(알약 스타일)
// 경로 + 경로 주변 맛집 마커 + 클릭 시 라벨 표시(알약 스타일, 안전화)
import React, { useMemo, useState } from "react";
import { Map, Polyline, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import type { LatLng } from "apis/request/tmap";
import type { Place } from "hooks/Map/usePlacesAlongPath";
import "../marker-label.css";

declare global { interface Window { kakao: any } }

interface Props {
  center: { lat: number; lng: number };
  level?: number;
  path: LatLng[];
  places: Place[]; // 예상: { id?: string; name: string; lat: number|string; lng: number|string; ... }
  onMapCreated?: (map: kakao.maps.Map) => void;
}

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : NaN;
}

function makeKey(p: { id?: string; lat: number; lng: number }): string {
  return p.id && p.id.length > 0 ? p.id : `${p.lat},${p.lng}`;
}

export default function RouteOverlay({ center, level = 4, path, places, onMapCreated }: Props) {
  const [focusKey, setFocusKey] = useState<string | null>(null);

  // 경로 폴리라인
  const linePath = useMemo(
    () => path
      .map((p) => ({ lat: toNumber(p.lat), lng: toNumber(p.lng) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [path]
  );

  // 마커/라벨용 장소(안전 파싱)
  const safePlaces = useMemo(() => {
    return places
      .map((pl, idx) => {
        const lat = toNumber((pl as any).lat);
        const lng = toNumber((pl as any).lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const id = (pl as any).id as string | undefined;
        const name = ((pl as any).name ??
                      (pl as any).place_name ??
                      `장소-${idx}`) as string;

        return {
          id,
          key: id && id.length > 0 ? id : `${lat},${lng}`, // 합성 키
          name,
          lat,
          lng,
          address: (pl as any).roadAddress || (pl as any).address || (pl as any).address_name || "",
        };
      })
      .filter(Boolean) as Array<{ id?: string; key: string; name: string; lat: number; lng: number; address?: string }>;
  }, [places]);

  return (
    <Map
      center={center}
      level={level}
      style={{ width: "100%", height: "100%" }}
      onCreate={onMapCreated}
    >
      {/* 경로 라인 */}
      {linePath.length >= 2 && (
        <Polyline path={[linePath]} strokeWeight={6} strokeOpacity={0.9} strokeColor="#7b5cff" />
      )}

      {/* 마커 + 라벨 */}
      {safePlaces.map((pl) => {
        const pos = { lat: pl.lat, lng: pl.lng };
        const isFocused = focusKey === pl.key;

        return (
          <React.Fragment key={pl.key}>
            <MapMarker
              position={pos}
              clickable
              onClick={() => setFocusKey(pl.key)}
            />
            {isFocused && (
              <CustomOverlayMap position={pos} yAnchor={1.25} zIndex={7}>
                <div className="km-label">{pl.name}</div>
              </CustomOverlayMap>
            )}
          </React.Fragment>
        );
      })}

      
      {/* 🔎 스모크 테스트
      <CustomOverlayMap position={center} yAnchor={1.25} zIndex={99}>
        <div className="km-label">라벨 스모크 테스트</div>
      </CustomOverlayMap>
      */}
      
    </Map>
  );
}
