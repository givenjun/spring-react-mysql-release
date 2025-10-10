
// src/components/Map/PlaceList/index.tsx
import React from "react";
import "./style.css";

export type PlaceItem = {
  id?: string | number;
  name?: string;
  place_name?: string;
  lat: number | string;
  lng: number | string;
};

interface Props {
  places: PlaceItem[];
  isLoading?: boolean;
  hiddenWhileLoading?: boolean;
  /** 과거 호환용으로 남겨두지만 실제로는 호출하지 않습니다(= 단일 클릭 무시). */
  onItemClick?: (p: PlaceItem) => void;
  /** 더블클릭만 사용: 지도 이동 + 추가경로 생성 */
  onItemDoubleClick?: (p: PlaceItem) => void;
}

export default function PlaceList({
  places,
  isLoading = false,
  hiddenWhileLoading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onItemClick, // 단일 클릭은 더 이상 사용하지 않음(요구사항)
  onItemDoubleClick,
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
        const key = (p.id ?? `${p.lat},${p.lng}`) + "-" + idx;

        return (
          <li
            key={key}
            className="place-list-item"
            // ❗ 단일 클릭 핸들러 없음
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemDoubleClick?.(p);
            }}
            title="두 번 클릭하면 지도 이동 + 추가 경로 표시"
            style={{
              cursor: "pointer",
              userSelect: "none",
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {typeof p.lat === "string" ? p.lat : p.lat?.toFixed?.(6)} ,{" "}
              {typeof p.lng === "string" ? p.lng : p.lng?.toFixed?.(6)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
