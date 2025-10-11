import React, { useEffect, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";

import SummaryCard from "./components/SummaryCard";
import ChartSection from "./components/ChartSection";
import NoticePreview from "./components/NoticePreview";

interface DashboardData {
  userCount: number;
  newUsersThisWeek: number;
  postCount: number;
  postsThisWeek: number;
  noticeCount: number;
  latestNotices: { id: number; title: string; createdAt: string }[];
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminDashboard() {
  useAdminAuth(); // ✅ 관리자 권한 확인
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        customErrToast("로그인이 필요합니다.");
        return;
      }

      // ✅ Authorization 헤더 추가
      const response = await axios.get(`${DOMAIN}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code, message } = response.data;
      if (code === "SU") {
        setData({
          userCount: response.data.userCount,
          newUsersThisWeek: response.data.newUsersThisWeek,
          postCount: response.data.postCount,
          postsThisWeek: response.data.postsThisWeek,
          noticeCount: response.data.noticeCount,
          latestNotices: response.data.latestNotices,
        });
      } else {
        customErrToast(`대시보드 로드 실패: ${message}`);
      }
    } catch (error) {
      console.error(error);
      customErrToast("대시보드 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  if (loading) return <div className="admin-dashboard">로딩 중...</div>;

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">📊 대시보드</h2>

      {/* ✅ 상단 통계 카드 */}
      <div className="summary-section">
        <SummaryCard title="총 사용자 수" value={data?.userCount ?? 0} />
        <SummaryCard title="이번 주 가입자 수" value={data?.newUsersThisWeek ?? 0} />
        <SummaryCard title="전체 게시글 수" value={data?.postCount ?? 0} />
        <SummaryCard title="이번 주 게시글 수" value={data?.postsThisWeek ?? 0} />
      </div>

      {/* ✅ 차트 섹션 */}
      <ChartSection />

      {/* ✅ 최신 공지 미리보기 */}
      <NoticePreview latestNotices={data?.latestNotices ?? []} />
    </div>
  );
}
