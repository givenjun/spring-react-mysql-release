// import React, { useEffect, useRef } from 'react';
// import {
//   Map,
//   MapMarker,
//   MapTypeControl,
//   ZoomControl,
//   CustomOverlayMap,
// } from 'react-kakao-maps-sdk';

// interface Place {
//   id: string;
//   place_name: string;
//   x: string;
//   y: string;
//   address_name?: string;
//   road_address_name?: string;
//   category_name?: string;
//   phone?: string;
// }

// interface KakaoMapProps {
//   center: { lat: number; lng: number };
//   markers: Place[];
//   selectedIndex: number | null;
//   hoveredIndex?: number | null;
//   onMarkerClick: (index: number) => void;
//   onMarkerHover?: (index: number | null) => void;
//   bounds?: kakao.maps.LatLngBounds | null;
// }

// export default function KakaoMap({
//   center,
//   markers,
//   selectedIndex,
//   hoveredIndex,
//   onMarkerClick,
//   onMarkerHover,
//   bounds,
// }: KakaoMapProps) {
//   const mapRef = useRef<kakao.maps.Map | null>(null);

//   useEffect(() => {
//     if (mapRef.current && bounds) {
//       mapRef.current.setBounds(bounds);
//     }
//   }, [bounds]);

//   return (
//     <Map
//       center={center}
//       style={{ width: '100%', height: '100%' }}
//       level={4}
//       onCreate={(map) => (mapRef.current = map)}
//     >
//       <MapTypeControl position="TOPRIGHT" />
//       <ZoomControl position="RIGHT" />

//       {markers.map((place, index) => {
//         const isActive = selectedIndex === index || hoveredIndex === index;
//         const position = {
//           lat: parseFloat(place.y),
//           lng: parseFloat(place.x),
//         };

//         return (
//           <React.Fragment key={place.id || index}>
//             <MapMarker
//               position={position}
//               onClick={() => onMarkerClick(index)}
//               onMouseOver={() => onMarkerHover?.(index)}
//               onMouseOut={() => onMarkerHover?.(null)}
//               clickable
//             />
//             {isActive && (
//               <CustomOverlayMap position={position} yAnchor={1.6}>
//                 <div style={{
//                   background: 'white',
//                   border: '1px solid #ccc',
//                   borderRadius: '8px',
//                   padding: '8px 12px',
//                   fontSize: '13px',
//                   fontWeight: 500,
//                   color: '#333',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
//                   position: 'relative',
//                   whiteSpace: 'nowrap',
//                 }}>
//                   {place.place_name}
//                   {/* 말풍선 꼭지 */}
//                   <div style={{
//                     content: '""',
//                     position: 'absolute',
//                     bottom: '-8px',
//                     left: '50%',
//                     transform: 'translateX(-50%)',
//                     width: 0,
//                     height: 0,
//                     borderLeft: '6px solid transparent',
//                     borderRight: '6px solid transparent',
//                     borderTop: '8px solid white',
//                     zIndex: 1,
//                   }} />
//                 </div>
//               </CustomOverlayMap>
//             )}
//           </React.Fragment>
//         );
//       })}
//     </Map>
//   );
// }


import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  MapMarker,
  MapTypeControl,
  ZoomControl,
  CustomOverlayMap,
} from 'react-kakao-maps-sdk';
import '../marker-label.css';

declare global { interface Window { kakao: any } }

interface Place {
  id: string;
  place_name: string;
  x: string; // lng
  y: string; // lat
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  markers: Place[];
  selectedIndex?: number | null;           // 부모가 안 내려줘도 동작하게 optional 로
  hoveredIndex?: number | null;
  onMarkerClick?: (index: number) => void;
  onMarkerHover?: (index: number | null) => void;
  bounds?: kakao.maps.LatLngBounds | null;
}

export default function KakaoMap({
  center,
  markers,
  selectedIndex = null,
  hoveredIndex = null,
  onMarkerClick,
  onMarkerHover,
  bounds,
}: KakaoMapProps) {
  const mapRef = useRef<kakao.maps.Map | null>(null);

  // ✅ 내부 상태: 부모 미연동이어도 클릭/호버만으로 라벨 표시
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(null);
  const [internalHoverIndex, setInternalHoverIndex] = useState<number | null>(null);

  // 외부 값이 있으면 우선 사용, 없으면 내부 상태 사용
  const activeIndex = selectedIndex ?? internalActiveIndex;
  const hoverIndex  = hoveredIndex  ?? internalHoverIndex;

  // 좌표 파싱 안전화
  const safeMarkers = useMemo(() => {
    return markers.map((p, i) => ({
      key: p.id || `m-${i}`,
      name: p.place_name,
      lat: Number(p.y),
      lng: Number(p.x),
    })).filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  }, [markers]);

  useEffect(() => {
    if (mapRef.current && bounds) mapRef.current.setBounds(bounds);
  }, [bounds]);

  return (
    <Map
      center={center}
      style={{ width: '100%', height: '100%' }}
      level={4}
      onCreate={(map) => (mapRef.current = map)}
    >
      <MapTypeControl position="TOPRIGHT" />
      <ZoomControl position="RIGHT" />

      {safeMarkers.map((m, index) => {
        const isActive = activeIndex === index || hoverIndex === index;
        const position = { lat: m.lat, lng: m.lng };

        return (
          <React.Fragment key={m.key}>
            <MapMarker
              position={position}
              clickable
              onClick={() => {
                setInternalActiveIndex(index);
                onMarkerClick?.(index);
              }}
              onMouseOver={() => {
                setInternalHoverIndex(index);
                onMarkerHover?.(index);
              }}
              onMouseOut={() => {
                setInternalHoverIndex(null);
                onMarkerHover?.(null);
              }}
            />
            {isActive && (
              <CustomOverlayMap position={position} yAnchor={1.25} zIndex={99}>
                <div className="km-label">{m.name}</div>
              </CustomOverlayMap>
            )}
          </React.Fragment>
        );
      })}

      {/* 🔎 스모크 테스트: 아래 주석 해제하면 지도 중심에 라벨이 항상 1개 뜸
      <CustomOverlayMap position={center} yAnchor={1.25} zIndex={999}>
        <div className="km-label">라벨 테스트</div>
      </CustomOverlayMap>
      */}
    </Map>
  );
}
