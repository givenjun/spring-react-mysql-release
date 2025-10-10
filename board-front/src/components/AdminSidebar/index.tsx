import React, { useState } from "react";
import "./style.css";

type MenuItem = {
  label: string;
  key: string; // 경로 대신 내부 상태 키로 구분
  icon?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onChangeSection: (key: string) => void; // 외부로 상태 전달
  activeSection: string;
};

export default function AdminSidebar({
  open,
  onClose,
  onChangeSection,
  activeSection,
}: Props) {
  const [selected, setSelected] = useState(activeSection);

  const menuItems: MenuItem[] = [
    { label: "공지사항", key: "notices", icon: "📢" },
    { label: "게시판 관리", key: "boards", icon: "📝" },
    { label: "회원 관리", key: "users", icon: "👥" },
    { label: "대시보드", key: "dashboard", icon: "📊" },
  ];

  const handleMenuClick = (key: string) => {
    setSelected(key);
    onChangeSection(key); // 상위 컴포넌트에 상태 전달
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  return (
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <header className="admin-sidebar-header">
        <strong className="admin-sidebar-title">관리자 메뉴</strong>
        <button
          type="button"
          className="admin-sidebar-close"
          onClick={onClose}
          aria-label="사이드바 닫기"
        >
          ✕
        </button>
      </header>

      <nav className="admin-sidebar-nav">
        <ul>
          {menuItems.map((menu) => {
            const isActive = selected === menu.key;
            return (
              <li key={menu.key}>
                <button
                  className={`admin-sidebar-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(menu.key)}
                >
                  <span className="icon">{menu.icon}</span>
                  <span className="label">{menu.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="admin-sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </footer>
    </aside>
  );
}
