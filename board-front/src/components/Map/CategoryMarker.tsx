import { MapMarker } from "react-kakao-maps-sdk";
import { normalizeCategory, FoodCategory } from "constant/category";

type Props = {
  lat: number | string;
  lng: number | string;
  category?: string;     // "한식" | "족발/보쌈" | "카페" | ...
  size?: number;         // 표시 크기(px). 기본 52 (지붕 있는 아이콘에 맞춤)
  anchorX?: number;
  anchorY?: number;
  zIndex?: number;
  onClick?: () => void;
};

const ICON: Record<FoodCategory, string> = {
  한식: "/assets/markers/한식.png",
  중식: "/assets/markers/중식.png",
  일식: "/assets/markers/일식.png",
  패스트푸드: "/assets/markers/패스트푸드.png",
  분식: "/assets/markers/분식.png",
  카페: "/assets/markers/카페.png",
  피자: "/assets/markers/피자.png",
  족발: "/assets/markers/족발.png",
  기타: "/assets/markers/기타.png",
};

export default function CategoryMarker({
  lat, lng, category, size = 52, anchorX, anchorY, zIndex = 110, onClick,
}: Props) {
  const cat = normalizeCategory(category);
  const src = ICON[cat] ?? ICON["기타"];

  const w = size, h = size;               // PNG가 정사각형 스타일일 때
  const ax = anchorX ?? w / 2;            // 중앙
  const ay = anchorY ?? h;                // 아래 끝이 좌표에 닿게

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
