// hooks/Map/RouteOptionsList/index.tsx
import React from 'react';
import type { RouteOption } from 'hooks/Map/useRoute';

interface Props {
  routes: RouteOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;          // 단일 클릭: 지도 강조
  onOpenDetail: (index: number) => void;      // 더블클릭: 오른쪽 상세/맛집 패널 열기
}

function fmtTime(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}시간 ${mm}분`;
}
function fmtDist(m: number) {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function RouteOptionsList({ routes, selectedIndex, onSelect, onOpenDetail }: Props) {
  if (!routes || routes.length === 0) return null;

  const fastest = Math.min(...routes.map(r => r.timeSec));

  return (
    <div className="list-rounded route-list">
      <div className="list-scroll route-list-scroll">
        {routes.map((r, i) => {
          const deltaMin = Math.round((r.timeSec - fastest) / 60);
          const badge =
            r.name === '빠른길' ? '가장 빠름' :
            r.name === '쉬운길' ? '편안·안전' : '균형 추천';

          return (
            <div
              key={r.id}
              className={`search-result-item ${selectedIndex === i ? 'selected' : ''}`}
              onClick={() => onSelect(i)}
              onDoubleClick={() => onOpenDetail(i)}
              onMouseDown={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              onKeyDown={(e)=>{ if (e.key==='Enter') onOpenDetail(i); }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div style={{ fontWeight: 700 }}>
                  {r.name}
                  <span style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(79,70,229,0.08)',
                    color: '#4f46e5'
                  }}>{badge}</span>
                </div>
                <div style={{ fontWeight: 800 }}>{fmtTime(r.timeSec)}</div>
              </div>

              <div style={{ fontSize: 12, color:'#555', marginTop: 4 }}>
                {fmtDist(r.distanceM)}
                {deltaMin > 0 && <span style={{ marginLeft: 10, opacity:.85 }}>빠른길 대비 +{deltaMin}분</span>}
              </div>

              {/* (선택) 새 지표 간단 공개: 유저가 '쉬움' 판단 근거를 이해하기 쉬움 */}
              {r.easeDetail && (
                <div style={{ fontSize: 11, color:'#777', marginTop: 6 }}>
                  곡률 {r.easeDetail.curvaturePerKm.toFixed(0)}°/km ·
                  큰턴 {r.easeDetail.hardTurnsPerKm.toFixed(1)}/km ·
                  지그재그 {(r.easeDetail.zigzagRate * 100).toFixed(0)}% ·
                  짧은세그 {(r.easeDetail.shortSegRate * 100).toFixed(0)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
