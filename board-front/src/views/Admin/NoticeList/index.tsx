import React, { useEffect, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast, usePagination } from "hooks";
import NoticeModal from "./NoticeModal";
import DeleteConfirmModal from '../common/DeleteConfirmModal';

interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminNoticeList() {
  useAdminAuth();
  const [loading, setLoading] = useState(true);

  // ✅ 페이지네이션 훅 (페이지당 5개씩)
  const {
    currentPage,
    setCurrentPage,
    viewList,
    viewPageList,
    totalSection,
    currentSection,
    setCurrentSection,
    setTotalList,
  } = usePagination<Notice>(5);

  // ✅ 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetNotice, setTargetNotice] = useState<Notice["id"]>();

  // ✅ 날짜 포맷
  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  // ✅ 공지 목록 불러오기
  const getAdminNoticeList = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${DOMAIN}/api/v1/notice`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code, noticeList } = response.data;
      if (code === "SU") setTotalList(noticeList);
      else customErrToast("공지사항 목록을 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      customErrToast("공지 목록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ 공지 삭제 함수
  const confirmDeleteNotice = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(`${DOMAIN}/api/v1/notice/admin/${targetNotice}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code } = response.data;
      if (code === "SU") {
        getAdminNoticeList();
        customErrToast("공지가 삭제되었습니다.");
      } else {
        customErrToast("삭제 실패. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error(error);
      customErrToast("삭제 중 오류가 발생했습니다.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    getAdminNoticeList();
  }, []);

  if (loading) return <div className="admin-notice-list">로딩 중...</div>;

  return (
    <div className="admin-notice-list">
      <div className="admin-notice-header">
        <h2>📢 공지사항 관리</h2>
        <div className="admin-notice-add">
          <button
            className="admin-btn add"
            onClick={() => {
              setSelectedNotice(null);
              setShowModal(true);
            }}
          >
            ＋
          </button>
        </div>
      </div>

      {viewList.length === 0 ? (
        <p>등록된 공지가 없습니다.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>상단고정</th>
                <th>번호</th>
                <th>제목</th>
                <th>작성일</th>
                <th>수정일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {viewList.map((notice, index) => (
                <tr key={notice.id}>
                  <td>{notice.pinned ? "📌" : "-"}</td>
                  <td>{(currentPage - 1) * 5 + index + 1}</td>
                  <td title={notice.title}>{notice.title}</td>
                  <td>{formatDate(notice.createdAt)}</td>
                  <td>{formatDate(notice.updatedAt)}</td>
                  <td className="action-buttons">
                    <button
                      className="admin-btn update"
                      onClick={() => {
                        setSelectedNotice(notice);
                        setShowModal(true);
                      }}
                    >
                      수정하기
                    </button>
                    <button
                      className="admin-btn delete"
                      onClick={() => {
                        setTargetNotice(notice.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      삭제하기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ 페이지네이션 영역 */}
      <div className="pagination">
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

      {/* ✅ 작성 / 수정 모달 */}
      {showModal && (
        <NoticeModal
          notice={selectedNotice}
          onClose={() => setShowModal(false)}
          onSuccess={getAdminNoticeList}
        />
      )}

      {/* ✅ 삭제 모달 */}
      {showDeleteModal && (
        <DeleteConfirmModal
          message={`해당 공지사항을 삭제하시겠습니까?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteNotice}
        />
      )}
    </div>
  );
}
