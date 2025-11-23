// src/components/Map/KakaoPlaceViewer/index.tsx
import React from "react";
import "./style.css";

interface KakaoPlaceViewerProps {
  title?: string;
  placeUrl: string;
  onClose: () => void;
}

export default function KakaoPlaceViewer({
  title,
  placeUrl,
  onClose,
}: KakaoPlaceViewerProps) {
  if (!placeUrl) return null;

  return (
    <div className="kakao-place-viewer">
      <div className="kakao-place-viewer-header">
        <div className="kakao-place-viewer-title">
          {title || "가게 상세 정보"}
        </div>
        <button
          type="button"
          className="kakao-place-viewer-close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="kakao-place-viewer-body">
        {/* 카카오 place_url 페이지를 그대로 임베드 */}
        <iframe
          src={placeUrl}
          title={title || "카카오맵 상세"}
          frameBorder={0}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
 