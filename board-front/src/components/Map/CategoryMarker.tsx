// src/components/Map/CategoryMarker/index.tsx
import { MapMarker } from "react-kakao-maps-sdk";

type Props = {
  lat: number | string;
  lng: number | string;
  category?: string;     // "한식" | "족발" | "카페" | "기타" | undefined
  size?: number;         // 표시 크기(px). 기본 52
  anchorX?: number;
  anchorY?: number;
  zIndex?: number;

  // 선택적으로 쓰는 클릭 핸들러
  // 👉 이게 없으면 마커는 클릭 이벤트를 먹지 않고 지도까지 통과
  onClick?: () => void;
};

// 키 문자열만 맞추면 되도록 단순 맵으로 변경
const ICON: { [key: string]: string } = {
  한식: "/assets/markers/한식.png",
  중식: "/assets/markers/중식.png",
  일식: "/assets/markers/일식.png",
  패스트푸드: "/assets/markers/패스트푸드.png",
  치킨: "/assets/markers/치킨.png",
  분식: "/assets/markers/분식.png",
  카페: "/assets/markers/카페.png",
  피자: "/assets/markers/피자.png",
  족발: "/assets/markers/족발.png",
  기타: "/assets/markers/기타.png",

  // ⭐ 음식점/카페가 아닌 애들 전용 기본 아이콘
  기본: "/assets/markers/기본마커.png",
};

export default function CategoryMarker({
  lat,
  lng,
  category,
  size = 96,
  anchorX,
  anchorY,
  zIndex = 110,
  onClick,
}: Props) {
  const key = category ?? "기본";
  const isBasic = !category || key === "기본";

  // 🔽 기본 마커는 조금 더 작게 (예: 0.6배)
  const effectiveSize = isBasic ? Math.round(size * 1.0) : size;

  const w = effectiveSize;
  const h = effectiveSize;
  const ax = anchorX ?? w / 2;

  // ✅ 기본 마커는 중심 쪽(0.3h) 기준, 음식 마커는 기존처럼 맨 아래(h) 기준
  const ay = anchorY ?? (isBasic ? Math.round(h * 0.3) : h);

  const src = ICON[key] ?? ICON["기본"];

  return (
    <MapMarker
      position={{ lat: Number(lat), lng: Number(lng) }}
      image={{
        src,
        size: { width: w, height: h },
        options: { offset: { x: ax, y: ay } },
      }}
      // 🔥 onClick 이 있을 때만 마커가 클릭을 가로챔
      //    (없으면 클릭이 지도/폴리라인까지 전달됨)
      clickable={!!onClick}
      zIndex={zIndex}
      onClick={onClick}
    />
  );
}
