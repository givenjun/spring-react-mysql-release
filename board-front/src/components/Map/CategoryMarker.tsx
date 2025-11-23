import { MapMarker } from "react-kakao-maps-sdk";
import { normalizeCategory, FoodCategory } from "constant/category";

type Props = {
  lat: number | string;
  lng: number | string;
  category?: string;     // "한식" | "족발/보쌈" | "카페" | ...
  size?: number;         // 표시 크기(px). 기본 52
  anchorX?: number;
  anchorY?: number;
  zIndex?: number;
  onClick?: () => void;
};

const ICON: Record<FoodCategory | "기본", string> = {
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

  // ⭐ 음식점/카페가 아닐 때 기본 아이콘
  기본: "/assets/markers/기본마커.png",
};

export default function CategoryMarker({
  lat, lng, category, size = 52, anchorX, anchorY, zIndex = 110, onClick,
}: Props) {
  // ⬇️ category가 없으면 "기본" 사용
  const cat = category ? normalizeCategory(category) : "기본";
  const src = ICON[cat] ?? ICON["기본"];

  const w = size, h = size;
  const ax = anchorX ?? w / 2;
  const ay = anchorY ?? h;

  return (
    <MapMarker
      position={{ lat: Number(lat), lng: Number(lng) }}
      image={{ src, size: { width: w, height: h }, options: { offset: { x: ax, y: ay } } }}
      clickable
      zIndex={zIndex}
      onClick={onClick}
    />
  );
}
