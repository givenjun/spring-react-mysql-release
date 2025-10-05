import React, { useEffect, useRef } from 'react';
import './style.css';

export interface PlaceDetail {
  id?: string;
  name: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
  imageUrl?: string;   // 대표 사진 URL (선택)
  url?: string;        // 외부 링크(선택)
  distanceText?: string;
  categoryText?: string;
  lat?: number;
  lng?: number;
}

type Props = {
  open: boolean;
  place: PlaceDetail;

  onClose: () => void;
  onClickStart?: (place: PlaceDetail) => void; // 출발
  onClickDest?: (place: PlaceDetail) => void;  // 도착

  // 위치 조정
  leftSidebarWidth?: number;  // 좌측 검색 패널 폭(px)
  gap?: number;               // 좌 패널과 카드 간격(px)
  topOffset?: number;         // 상단 고정 헤더/버튼 높이(px)
  width?: number;             // 카드 폭(px)

  // 이 영역에 “맛집 리스트(UI)”를 그대로 렌더
  children?: React.ReactNode;
};

export default function PlaceDetailCard({
  open,
  place,
  onClose,
  onClickStart,
  onClickDest,
  leftSidebarWidth = 340,
  gap = 16,
  topOffset = 64,
  width = 520,
  children
}: Props) {
  const { name, imageUrl, categoryText } = place;

  // 접근성: 열릴 때 닫기 버튼에 포커스, ESC로 닫기
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <aside
      className={`pd-card ${open ? 'open' : ''}`}
      style={
        {
          // @ts-ignore CSS 변수 전달
          '--pd-left': `${leftSidebarWidth + gap}px`,
          '--pd-top': `${topOffset}px`,
          '--pd-width': `${width}px`
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      aria-label="경로 주변 장소"
    >
      <header className="pd-head">
        <button
          className="pd-back"
          aria-label="닫기"
          onClick={onClose}
          ref={closeBtnRef}
        >
          ❮
        </button>
        <div className="pd-title">
          <strong className="pd-name">{name}</strong>
          {categoryText && <span className="pd-cat">{categoryText}</span>}
        </div>
        <button className="pd-close" aria-label="닫기" onClick={onClose}>✕</button>
      </header>

      {imageUrl && (
        <div className="pd-hero">
          <img src={imageUrl} alt={`${name} 대표 이미지`} />
        </div>
      )}

      <div className="pd-cta">
        <button className="pd-chip" onClick={() => onClickStart?.(place)}>출발</button>
        <button className="pd-chip primary" onClick={() => onClickDest?.(place)}>도착</button>
      </div>

      {/* 탭 없이, 맛집 리스트만 표시 */}
      <section className="pd-body">
        <div className="pd-slot">
          {children ?? <div className="pd-empty">경로 주변 맛집이 없습니다.</div>}
        </div>
      </section>
    </aside>
  );
}
