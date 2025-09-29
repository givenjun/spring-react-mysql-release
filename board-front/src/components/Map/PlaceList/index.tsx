// src/components/Map/PlaceList/index.tsx
import React from "react";
import "./style.css";
import type { Place } from "hooks/Map/usePlacesAlongPath";

interface Props {
  places: Place[];
  onFocusPlace?: (p: Place) => void;
}

export default function PlaceList({ places, onFocusPlace }: Props) {
  if (!places?.length) return null;

  return (
    <div className="place-list">
      {places.map((p) => (
        <button
          key={p.id}
          className="place-item"
          onClick={() => onFocusPlace?.(p)}
          title={p.name}
        >
          <div className="place-name">{p.name}</div>
          <div className="place-meta">
            <span className="place-addr">{p.roadAddress || p.address}</span>
            {p.phone && <span className="place-phone">{p.phone}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
