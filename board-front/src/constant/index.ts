// src/constant/index.ts

// --- 기존 경로 상수 ---
export const MAIN_PATH = () => '/';
export const AUTH_PATH = () => '/auth';
export const SEARCH_PATH = (searchWord: string) => `/search/${searchWord}`;
export const USER_PATH = (userEmail: string) => `/user/${userEmail}`;
export const BOARD_PATH = () => `/board`;
export const BOARD_WRITE_PATH = () => `write`;
export const BOARD_DETAIL_PATH = (boardNumber: string | number) => `detail/${boardNumber}`;
export const BOARD_UPDATE_PATH = (boardNumber: string | number) => `update/${boardNumber}`;
export const NOTICE_PATH = () => `/notice`;

// --- 쉬움(Ease) 지표 파라미터(튜닝용) ---
export const EASE_PARAMS = {
  // 각도/세그먼트 관련
  hardTurnDeg: 60,   // 큰 턴 기준(기존 30°보다 상향: 급회전만 패널티)
  kinkDeg: 45,       // 곡률 누적 시작 임계각
  shortSegM: 10,     // 짧은 세그먼트 기준

  // 가중치 (합이 1일 필요 없음)
  wCurvature: 0.45,  // 곡률(절대 회전각 합/km)
  wHardTurns: 0.25,  // 큰 턴 수/km
  wZigzag:   0.15,   // 좌↔우 전환율
  wShortSeg: 0.15,   // 짧은 세그먼트 비율

  // 안정화
  minPathMeters: 50, // 너무 짧은 경로 보호
};
