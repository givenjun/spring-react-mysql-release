// src/components/Map/PlaceMiniViewer.tsx
import React from 'react';

export interface PlaceMiniViewerProps {
  place: {
    name: string;
    lat: number;
    lng: number;
    placeUrl?: string;
  };
  onClose: () => void;

  // 🔥 "두 경로사이 맛집리스트" 패널 옆에 붙을 left 위치
  anchorLeft: number;
}

const PlaceMiniViewer: React.FC<PlaceMiniViewerProps> = ({ place, onClose, anchorLeft }) => {
  const { name, lat, lng, placeUrl } = place;

  const kakaoUrl =
    placeUrl && typeof placeUrl === "string"
      ? placeUrl.replace(/^http:\/\//, "https://")   // ← 핵심 한 줄
      : `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

  return (
    <div
      style={{
        position: 'fixed',
        left: anchorLeft,
        top: 64,
        width: 420,
        height: 540,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.28)',
        overflow: 'hidden',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        // 🔥 패널과 함께 부드럽게 이동
        transition: 'left 0.3s ease-in-out, top 0.3s ease-in-out',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
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
  );
};

export default PlaceMiniViewer;
