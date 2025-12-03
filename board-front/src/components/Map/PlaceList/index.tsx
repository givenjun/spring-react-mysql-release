// src/components/Map/PlaceList/index.tsx
import React from "react";
import "./style.css";

export type PlaceItem = {
  id?: string | number;
  name?: string;
  place_name?: string;
  lat: number | string;
  lng: number | string;

  /** 🔥 Main에서 계산해서 넣어주는 ETA(분) */
  etaMinFromBase?: number;

  /** 🔥 카카오 place URL */
  place_url?: string;
  placeUrl?: string;
};

interface Props {
  places: PlaceItem[];
  isLoading?: boolean;
  hiddenWhileLoading?: boolean;

  // 단일 클릭: 미니뷰어 열기 등
  onItemClick?: (p: PlaceItem) => void;

  // 더블클릭: 지도 이동 + 추가경로 생성
  onItemDoubleClick?: (p: PlaceItem) => void;

  // 우측 아이콘(상세보기 / 카카오맵 등)
  onDetailClick?: (place: any) => void;

  // ✅ 두 경로사이 맛집리스트에서 선택된 아이템 표시용
  //   (부모에서 "현재 미니뷰어에 떠 있는 place"의 id 혹은 lat,lng 넘겨주기)
  selectedKey?: string | number | null;
}

export default function PlaceList({
  places,
  isLoading = false,
  hiddenWhileLoading = false,
  onItemClick,
  onItemDoubleClick,
  onDetailClick,
  selectedKey = null,
}: Props) {
  // 로딩 / 빈 리스트 처리
  if (isLoading && hiddenWhileLoading) {
    return <div className="place-list loading">로딩 중…</div>;
  }
  if (!Array.isArray(places) || places.length === 0) {
    return <div className="place-list empty">표시할 장소가 없습니다.</div>;
  }

  return (
    <ul
      className="place-list"
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {places.map((p, idx) => {
        const title = p.name || p.place_name || "이름 없음";

        // 🔑 selectedKey 가 넘어온 경우에는 lat,lng 기준으로만 비교해준다
        const useLatLngKey = selectedKey !== null && selectedKey !== undefined;
        const rawKey = useLatLngKey
          ? `${p.lat},${p.lng}`
          : (p.id ?? `${p.lat},${p.lng}`);
        const key = `${rawKey}-${idx}`;

        const isSelected =
          selectedKey !== null &&
          String(selectedKey) === String(rawKey);

        const eta =
          typeof p.etaMinFromBase === "number"
            ? p.etaMinFromBase
            : undefined;

        return (
          <li
            key={key}
            className={`place-list-item ${isSelected ? "selected" : ""}`}
            aria-selected={isSelected}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemClick?.(p);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemDoubleClick?.(p);
            }}
            style={{
              cursor: "pointer",
              userSelect: "none",
              padding: "12px 14px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              // 🔥 선택된 항목만 살짝 어둡게 – 반투명 명암 느낌
              backgroundColor: isSelected
                ? "rgba(15, 23, 42, 0.06)" // 매우 연한 딥그레이 오버레이
                : "transparent",
              transition: "background-color 0.18s ease",
            }}
          >
            {/* 왼쪽: 이름 영역 */}
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div
                className="place-title"
                style={{
                  fontWeight: isSelected ? 700 : 600,
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#111", // 텍스트 컬러는 유지(명암만 주는 느낌)
                }}
              >
                {title}
              </div>

              <div style={{ fontSize: 12, color: "#666" }}>
                {/* 좌표 표시는 숨김
                {typeof p.lat === "string" ? p.lat : p.lat?.toFixed?.(6)},{" "}
                {typeof p.lng === "string" ? p.lng : p.lng?.toFixed?.(6)}
                */}
              </div>
            </div>

            {/* 오른쪽: ETA(분) */}
            {eta !== undefined && (
              <div
                style={{
                  marginLeft: 12,
                  fontSize: 13,
                  color: "#333",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                예상소요시간 {eta}분
              </div>
            )}

            {/* 오른쪽: 상세 보기 아이콘 버튼 */}
            <button
              className="place-action-btn"
              onClick={(e) => {
                e.stopPropagation(); // 상위 li 클릭(미니뷰어/지도 이동) 막기
                onDetailClick?.(p);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
