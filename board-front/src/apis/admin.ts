import axios from "axios";

const DOMAIN = process.env.REACT_APP_API_URL;
const API_BASE_URL = `${DOMAIN}/api/v1/admin`;

// JWT 토큰 자동 헤더 추가
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----------------------------------------------------------------------
// 📌 게시판 관리 API
// ----------------------------------------------------------------------

/** 관리자 게시글 전체 조회 */
export const getAdminBoardList = async () => {
  const response = await api.get("/board-list");
  return response.data;
};

/** 게시글 삭제 */
export const deleteAdminBoard = async (boardNumber: number) => {
  const response = await api.delete(`/board/${boardNumber}`);
  return response.data;
};

// ----------------------------------------------------------------------
// 📌 회원 관리 API
// ----------------------------------------------------------------------

/** 전체 회원 조회 */
export const getAdminUserList = async () => {
  const response = await api.get("/users");
  return response.data;
};

/** 회원 삭제 */
export const deleteAdminUser = async (email: string) => {
  const response = await api.delete(`/users/${email}`);
  return response.data;
};


