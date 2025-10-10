import React, { useState } from "react";
import AdminSidebar from "components/AdminSidebar";
import AdminBoardList from "./BoardList";
import AdminUserList from "./UserList";
import { useAdminAuth } from "hooks";
import AdminNoticeList from "./NoticeList";
import AdminDashboard from "./Dashboard";
import "./style.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState("dashboard");
  useAdminAuth();

  return (
    <div
      className="admin-layout"
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#fafafa",
        position: "relative",
      }}
    >
      {/* ✅ 사이드바 */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onChangeSection={setSection}
        activeSection={section}
      />

      {/* ✅ 사이드바 토글 버튼 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          top: "calc(50% - 24px)",
          left: sidebarOpen ? "260px" : "0", // 사이드바 오른쪽 or 왼쪽 화면 끝
          transform: "translateY(-50%)",
          background: "#4a3aff",
          color: "white",
          border: "none",
          borderRadius: "0 8px 8px 0", // 오른쪽 곡선
          padding: "12px 10px",
          cursor: "pointer",
          zIndex: 50,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        }}
      >
        {sidebarOpen ? "◀" : "☰"}
      </button>

      {/* ✅ 메인 콘텐츠 영역 */}
      <main
        className="admin-main"
        style={{
          flexGrow: 1,
          marginLeft: sidebarOpen ? 260 : 0,
          transition: "margin-left 0.3s ease",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        {section === "notices" && <AdminNoticeList />}
        {section === "boards" && <AdminBoardList />}
        {section === "users" && <AdminUserList />}
        {section === "dashboard" && <AdminDashboard />}
      </main>
    </div>
  );
}
