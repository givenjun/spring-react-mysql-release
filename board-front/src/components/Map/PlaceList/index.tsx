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

  // ✅ 두 경로사이 맛집리스트에서 선택된 아이템 표시용
  selectedKey?: string | number | null;
}

export default function PlaceList({
  places,
  isLoading = false,
  hiddenWhileLoading = false,
  onItemClick,
  onItemDoubleClick,
  selectedKey = null,
}: Props) {
  if (isLoading && hiddenWhileLoading) {
    return <div className="place-list loading">로딩 중…</div>;
  }
  if (!Array.isArray(places) || places.length === 0) {
    return <div className="place-list empty">표시할 장소가 없습니다.</div>;
  }

  return (
    <ul className="place-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {places.map((p, idx) => {
        const title = p.name || p.place_name || "이름 없음";

        // 🔑 선택 비교용 key( id 가 있으면 id, 없으면 lat,lng )
        const rawKey = p.id ?? `${p.lat},${p.lng}`;
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
              backgroundColor: isSelected ? "#f5ecff" : "transparent", // 🔥 선택 시 연보라 배경
            }}
          >
            {/* 왼쪽: 이름 */}
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div
                style={{
                  fontWeight: isSelected ? 700 : 600,
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: isSelected ? "#4c1d95" : "#111", // 선택 시 보라색 텍스트
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
          </li>
        );
      })}
    </ul>
  );
}
