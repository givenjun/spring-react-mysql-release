// src/views/Error/NotFound.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("hide-layout");
    return () => document.body.classList.remove("hide-layout");
  }, []);

  return (
    <div className="not-found-page">
      <h1>404 Not Found</h1>
      <p>페이지를 찾을 수 없습니다 🥲</p>
      <button onClick={() => navigate("/")}>메인으로 돌아가기</button>
    </div>
  );
}
