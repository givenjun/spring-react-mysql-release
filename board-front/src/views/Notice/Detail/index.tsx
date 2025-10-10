import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { customErrToast } from "hooks";

interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  writerEmail: string;
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function NoticeDetail() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const getNoticeDetail = async () => {
    try {
      const response = await axios.get(`${DOMAIN}/api/v1/notice/${noticeId}`);
      const body = response.data;
      if (body.code === "SU") {
        setNotice({
          id: body.id,
          title: body.title,
          content: body.content,
          pinned: body.pinned,
          createdAt: body.createdAt,
          updatedAt: body.updatedAt,
          writerEmail: body.writerEmail,
        });
      } else {
        customErrToast("공지사항을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      customErrToast("공지사항 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noticeId) getNoticeDetail();
  }, [noticeId]);

  if (loading) return <div id="notice-detail-wrapper">불러오는 중...</div>;
  if (!notice) return <div id="notice-detail-wrapper">공지사항이 존재하지 않습니다.</div>;

  // ✅ 날짜 포맷 및 관리자 정보
  const createdDate = formatDate(notice.createdAt);
  const updatedDate = formatDate(notice.updatedAt);
  const isUpdated = notice.createdAt !== notice.updatedAt;
  const writerName = notice.writerEmail === "admin@routepick.com" ? "관리자 RoutePick" : notice.writerEmail;

  return (
    <div id="notice-detail-wrapper">
      <div className="notice-detail-container">
        {/* 헤더 */}
        <div className="notice-detail-header">
          {notice.pinned && <div className="notice-detail-pin">📌 상단 고정</div>}
          <h1 className="notice-detail-title">{notice.title}</h1>

          <div className="notice-detail-meta">
            <span className="writer">{writerName}</span>
            <span className="meta-divider">|</span>
            <span className="date">작성일 {createdDate}</span>
            {isUpdated && (
              <>
                <span className="meta-divider">|</span>
                <span className="date">수정일 {updatedDate}</span>
              </>
            )}
          </div>
        </div>

        <div className="notice-divider"></div>
        {/* 본문 */}
        <div className="notice-detail-content">
          <pre className="notice-detail-text">{notice.content}</pre>
        </div>

        <div className="notice-divider"></div>

        {/* 하단 버튼 */}
        <div className="notice-detail-footer">
          <button className="back-btn" onClick={() => navigate("/notice")}>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
