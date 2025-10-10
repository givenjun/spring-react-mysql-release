import React, { useEffect, useState } from "react";
import "./style.css";

import axios from "axios";
import SummaryCard from "./components/SummaryCard";
import ChartSection from "./components/ChartSection";
import NoticePreview from "./components/NoticePreview";

interface DashboardData {
  userCount: number;
  newUsersThisWeek: number;
  postCount: number;
  reportedPosts: number;
  noticeCount: number;
  latestNotices: { id: number; title: string; createdAt: string }[];
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    axios.get(`${DOMAIN}/api/admin/dashboard`)
      .then((res) => setData(res.data))
      .catch(() => console.error("Failed to load dashboard data"));
  }, []);

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">관리자 대시보드</h2>

      {/* 상단 통계 카드 */}
      <div className="summary-section">
        <SummaryCard title="총 사용자 수" value={data?.userCount ?? 0} />
        <SummaryCard title="신규 가입자(7일)" value={data?.newUsersThisWeek ?? 0} />
        <SummaryCard title="전체 게시글 수" value={data?.postCount ?? 0} />
        <SummaryCard title="신고된 게시글" value={data?.reportedPosts ?? 0} />
      </div>

      {/* 차트 섹션 */}
      <ChartSection />

      {/* 최신 공지 미리보기 */}
      <NoticePreview latestNotices={data?.latestNotices ?? []} />
    </div>
  );
}
