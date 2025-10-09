import React, { useState } from "react";
import AdminSidebar from "components/AdminSidebar";
import AdminBoardList from './BoardList';
import AdminUserList from './UserList';
import { useAdminAuth } from 'hooks';
import AdminNoticeList from "./NoticeList";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState("dashboard");
  useAdminAuth();
  return (
    <div className="admin-layout">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onChangeSection={setSection}
        activeSection={section}
      />

      <main
        className="admin-main"
        style={{
          marginLeft: sidebarOpen ? 260 : 0,
          transition: "margin-left 0.3s ease",
          padding: "20px",
        }}
      >
        <button
          style={{
            background: "#4a3aff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
            marginBottom: "12px",
          }}
          onClick={() => setSidebarOpen(true)}
        >
          메뉴 열기
        </button>
        {section === "notices" && <AdminNoticeList />}
        {section === "boards" && <div><AdminBoardList/></div>}
        {section === "users" && <div><AdminUserList/></div>}
        {section === "dashboard" && <div>📊 대시보드 영역</div>}
      </main>
    </div>
  );
}
