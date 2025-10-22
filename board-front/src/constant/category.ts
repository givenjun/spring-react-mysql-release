// 카테고리 정규화(탭/원천 텍스트 → 아이콘 키)
export type FoodCategory =
  | "한식" | "중식" | "일식" | "패스트푸드" | "치킨"| "분식" | "카페"
  | "피자" | "족발" | "기타";

const ALIASES: Record<string, FoodCategory> = {
  "카페/디저트": "카페",
  "카페": "카페",
  "족발/보쌈": "족발",
  "보쌈": "족발",
  "치킨": "치킨", // 전용 아이콘 없어서 임시 매핑
  "패스트푸드":"패스트푸드",
  "전체": "기타",
};

export function normalizeCategory(raw?: string): FoodCategory {
  const s = (raw ?? "").trim();
  if (!s) return "기타";
  if (ALIASES[s]) return ALIASES[s];
  const KNOWN: FoodCategory[] =
    ["한식","중식","일식","패스트푸드","치킨","분식","카페","피자","족발","기타"];
  return (KNOWN as string[]).includes(s as FoodCategory) ? (s as FoodCategory) : "기타";
}
