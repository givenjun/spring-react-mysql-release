// src/components/Map/RouteOverlay/index.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Map, MapMarker, Polyline, ZoomControl, MapTypeControl, CustomOverlayMap } from 'react-kakao-maps-sdk';

declare global { interface Window { kakao: any; } }

type LL = { lat: number; lng: number };

interface Props {
  center: LL;
  path: LL[];
  places: Array<{ lat: number; lng: number; name?: string }>;
  onMapCreated?: (map: kakao.maps.Map) => void;
  routeColor?: string;    // 경로 베이스 색상 (기본 보라)
}

function toRad(d: number) { return (d * Math.PI) / 180; }
function hav(a: LL, b: LL) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function buildCum(path: LL[]) {
  const cum: number[] = [0];
  for (let i=1;i<path.length;i++) cum[i] = cum[i-1] + hav(path[i-1], path[i]);
  return cum;
}
function lerp(a: number, b: number, t: number){ return a + (b - a) * t; }
function interp(path: LL[], cum: number[], s: number): LL {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (s <= 0) return path[0];
  const T = cum[cum.length-1] || 0;
  if (s >= T) return path[path.length-1];
  let lo=0, hi=cum.length-1;
  while (lo<hi) { const m=(lo+hi)>>1; if (cum[m] < s) lo=m+1; else hi=m; }
  const i = Math.max(1, lo);
  const s0=cum[i-1], s1=cum[i];
  const t=(s - s0)/ (s1 - s0);
  const A=path[i-1], B=path[i];
  return { lat: lerp(A.lat, B.lat, t), lng: lerp(A.lng, B.lng, t) };
}
function slice(path: LL[], cum: number[], a: number, b: number): LL[] {
  const T = cum[cum.length-1] || 0;
  if (T <= 0 || path.length < 2) return [];
  if (a < 0) a = 0;
  if (b > T) b = T;
  if (b <= a) return [];
  const S = interp(path, cum, a);
  const E = interp(path, cum, b);
  const seg: LL[] = [S];
  for (let i=1;i<path.length;i++) if (cum[i] > a && cum[i] < b) seg.push(path[i]);
  seg.push(E);
  return seg;
}

export default function RouteOverlay({
  center,
  path,
  places,
  onMapCreated,
  routeColor = '#8a2ea1', // 보라 베이스
}: Props) {
  const mapRef = useRef<kakao.maps.Map | null>(null);

  const cum = useMemo(() => (path.length > 1 ? buildCum(path) : [0]), [path]);
  const [phase, setPhase] = React.useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhase(p => p + dt * 120); // 대시 진행 속도
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => { setPhase(0); }, [path]);

  const DASH = 120;
  const GAP  = 170;
  const makeAntSegs = (phaseVal: number) => {
    const T = cum[cum.length-1] || 0;
    if (T <= 0 || path.length < 2) return [] as LL[][];
    const period = DASH + GAP;
    let startS = ((phaseVal % period) + period) % period;
    const need = Math.ceil(T / period) + 2;
    const cap = Math.min(2000, need);
    const segs: LL[][] = [];
    for (let s = startS, n=0; s < T && n < cap; s += period, n++) {
      const a = s;
      const b = Math.min(s + DASH, T);
      const seg = slice(path, cum, a, b);
      if (seg.length >= 2) segs.push(seg);
    }
    return segs;
  };

  const antSegs = useMemo(() => makeAntSegs(phase), [phase, path, cum]);

  return (
    <Map
      center={center}
      level={4}
      style={{ width:'100%', height:'100%' }}
      onCreate={(m) => { mapRef.current = m; onMapCreated?.(m); }}
    >
      <MapTypeControl position="TOPRIGHT" />
      <ZoomControl position="RIGHT" />

      {/* 경로: 3겹 구조 */}
      {path.length > 1 && (
        <>
          {/* 바닥 그림자(연한 진회색) */}
          <Polyline
            path={path}
            strokeWeight={8}
            strokeColor={'#c9c9c9'}
            strokeOpacity={0.6}
            strokeStyle={'solid'}
            zIndex={60}
          />
          {/* 베이스(메인 컬러) */}
          <Polyline
            path={path}
            strokeWeight={6}
            strokeColor={routeColor}
            strokeOpacity={0.95}
            strokeStyle={'solid'}
            zIndex={70}
          />
          {/* 상단 개미행렬(하이라이트) */}
          {antSegs.map((seg, i) => (
            <Polyline
              key={`ant-${i}`}
              path={seg}
              strokeWeight={8}
              strokeColor={'#ffffff'}
              strokeOpacity={0.9}
              strokeStyle={'solid'}
              zIndex={80}
            />
          ))}
        </>
      )}

      {/* 맛집 마커 */}
      {places.map((p, i) => (
        <React.Fragment key={`pl-${p.lat}-${p.lng}-${i}`}>
          <MapMarker position={{ lat: p.lat, lng: p.lng }} />
          {p.name && (
            <CustomOverlayMap position={{ lat: p.lat, lng: p.lng }} yAnchor={1.25} zIndex={90}>
              <div style={{
                background:'#111', color:'#fff', padding:'4px 8px',
                borderRadius:8, fontSize:12, whiteSpace:'nowrap'
              }}>
                {p.name}
              </div>
            </CustomOverlayMap>
          )}
        </React.Fragment>
      ))}
    </Map>
  );
}
