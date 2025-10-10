import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";
import { usePagination, customErrToast } from "hooks";
import { useNavigate } from "react-router-dom";

interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function NoticeList() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ 페이지네이션 (한 페이지당 6개)
  const {
    currentPage,
    currentSection,
    viewList,
    viewPageList,
    totalSection,
    setCurrentPage,
    setCurrentSection,
    setTotalList,
  } = usePagination<Notice>(6);

  // ✅ 날짜 포맷
  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  // ✅ 공지사항 불러오기
  const getNoticeList = async () => {
    try {
      const response = await axios.get(`${DOMAIN}/api/v1/notice`);
      const { code, noticeList } = response.data;
      if (code === "SU") setTotalList(noticeList);
      else customErrToast("공지사항을 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      customErrToast("공지 목록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNoticeList();
  }, []);

  if (loading) return <div className="notice-loading">공지사항을 불러오는 중...</div>;

  return (
    <div id="notice-wrapper">
      <div className="notice-container">
        <div className="notice-header">
          <div className="notice-title">📢 공지사항</div>
          <div className="notice-subtitle">서비스 관련 최신 소식을 확인하세요.</div>
        </div>

        {viewList.length === 0 ? (
          <p className="notice-empty">등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="notice-card-list">
            {viewList.map((notice) => (
              <div
                key={notice.id}
                className={`notice-card ${notice.pinned ? "pinned" : ""}`}
                onClick={() => navigate(`/notice/${notice.id}`)}
              >
                {notice.pinned && <div className="notice-pin">📌 상단 고정</div>}
                <div className="notice-card-title">{notice.title}</div>
                <div className="notice-card-date">{notice.updatedAt ? formatDate(notice.updatedAt) + " 수정" : formatDate(notice.createdAt)}</div>
                <div className="notice-card-preview">
                  {notice.content.length > 100
                    ? notice.content.slice(0, 100) + "..."
                    : notice.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ 페이지네이션 */}
        <div className="notice-pagination-box">
          <button
            onClick={() => setCurrentSection(currentSection - 1)}
            disabled={currentSection === 1}
          >
            ◀
          </button>

          {viewPageList.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={page === currentPage ? "active" : ""}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            disabled={currentSection === totalSection}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
