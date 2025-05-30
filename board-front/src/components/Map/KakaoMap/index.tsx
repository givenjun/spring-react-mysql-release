import React, { useEffect, useRef } from 'react';
import {
  Map,
  MapMarker,
  MapTypeControl,
  ZoomControl,
  CustomOverlayMap,
} from 'react-kakao-maps-sdk';

interface Place {
  id: string;
  place_name: string;
  x: string;
  y: string;
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  markers: Place[];
  selectedIndex: number | null;
  hoveredIndex?: number | null;
  onMarkerClick: (index: number) => void;
  onMarkerHover?: (index: number | null) => void;
  bounds?: kakao.maps.LatLngBounds | null;
}

export default function KakaoMap({
  center,
  markers,
  selectedIndex,
  hoveredIndex,
  onMarkerClick,
  onMarkerHover,
  bounds,
}: KakaoMapProps) {
  const mapRef = useRef<kakao.maps.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.setBounds(bounds);
    }
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

      {markers.map((place, index) => {
        const isActive = selectedIndex === index || hoveredIndex === index;
        const position = {
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
        };

        return (
          <React.Fragment key={place.id || index}>
            <MapMarker
              position={position}
              onClick={() => onMarkerClick(index)}
              onMouseOver={() => onMarkerHover?.(index)}
              onMouseOut={() => onMarkerHover?.(null)}
              clickable
            />
            {isActive && (
              <CustomOverlayMap position={position} yAnchor={1.6}>
                <div style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}>
                  {place.place_name}
                  {/* 말풍선 꼭지 */}
                  <div style={{
                    content: '""',
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid white',
                    zIndex: 1,
                  }} />
                </div>
              </CustomOverlayMap>
            )}
          </React.Fragment>
        );
      })}
    </Map>
  );
}
