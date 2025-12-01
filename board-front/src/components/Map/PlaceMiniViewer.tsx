// src/components/Map/PlaceMiniViewer.tsx
import React, { useEffect, useState } from 'react';

export interface PlaceMiniViewerProps {
  place: {
    name: string;
    lat: number;
    lng: number;
    placeUrl?: string;
  };
  onClose: () => void;
  anchorLeft: number; // PC에서만 사용됨
}

const PlaceMiniViewer: React.FC<PlaceMiniViewerProps> = ({ place, onClose, anchorLeft }) => {
  const { name, lat, lng, placeUrl } = place;

  // ✨ 모바일 감지 (768px 이하를 모바일로 간주)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const kakaoUrl =
    placeUrl && typeof placeUrl === 'string'
      ? placeUrl
      : `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

  // ✨ 스타일 분기 처리
  const containerStyle: React.CSSProperties = isMobile
    ? {
        // [모바일 스타일] 화면 중앙 정렬 팝업
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)', // 정중앙 배치
        width: '90%',      // 화면 꽉 차지 않게 여백 둠
        maxWidth: '360px', // 너무 커지지 않게 제한
        height: '60vh',    // 높이 적당히
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.4)', // 그림자 진하게
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        // [PC 스타일] 기존 로직 유지
        position: 'fixed',
        left: anchorLeft,
        top: 64,
        width: 420,
        height: 540,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.28)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'left 0.3s ease-in-out, top 0.3s ease-in-out',
      };

  return (
    <>
      {/* 모바일일 때 배경 어둡게 처리 (선택 사항) */}
      {isMobile && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', zIndex: 9998
          }}
        />
      )}
      
      <div style={containerStyle}>
        {/* 헤더 */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#fff'
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={name}
          >
            {name}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: 4,
              color: '#6b7280',
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 카카오맵 iframe */}
        <div style={{ flex: 1, background: '#f3f4f6' }}>
          <iframe
            title={`${name} - KakaoMap`}
            src={kakaoUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>

        {/* 하단 영역 */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#6b7280',
            background: '#fff'
          }}
        >
          <span>카카오맵 미니 뷰어</span>
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #8a2ea1',
              color: '#8a2ea1',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            크게 보기
          </a>
        </div>
      </div>
    </>
  );
};

export default PlaceMiniViewer;