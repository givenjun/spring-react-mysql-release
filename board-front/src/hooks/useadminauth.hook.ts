import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { customErrToast } from 'hooks';

export function useAdminAuth() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) {
      customErrToast("로그인이 필요합니다.");
      navigate("/auth");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      if (decoded.role !== "ADMIN") {
        customErrToast("관리자 전용 페이지입니다.");
        navigate("/");
      }
    } catch {
      customErrToast("유효하지 않은 토큰입니다.");
      localStorage.removeItem("accessToken");
      navigate("/auth");
    }
  }, [token, navigate]);
}

export default useAdminAuth;
