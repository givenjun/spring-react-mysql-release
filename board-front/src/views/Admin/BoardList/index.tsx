import React, { useEffect, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast, usePagination } from "hooks";
import DeleteConfirmModal from '../common/DeleteConfirmModal';

interface Board {
  boardNumber: number;
  title: string;
  writerEmail: string;
  writeDatetime: string;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminBoardList() {
  useAdminAuth();
  const [loading, setLoading] = useState(true);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [targetBoard, setTargetBoard] = useState<Board["boardNumber"]>();

  // ✅ 페이지네이션 훅 (페이지당 10개씩)
  const {
    currentPage,
    setCurrentPage,
    viewList,
    viewPageList,
    totalSection,
    currentSection,
    setCurrentSection,
    setTotalList,
  } = usePagination<Board>(10);

  // ✅ 게시글 목록 불러오기
  const getAdminBoardList = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${DOMAIN}/api/v1/admin/board-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { code, boardList } = response.data;
      if (code === "SU") setTotalList(boardList);
      else customErrToast("게시물 목록을 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      customErrToast("게시물 목록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

    // ✅ 게시글 삭제 함수
  const confirmDeleteBoard = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(`${DOMAIN}/api/v1/admin/board/${targetBoard}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code } = response.data;
      if (code === "SU") {
        getAdminBoardList();
        customErrToast("게시글이 삭제되었습니다.");
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

  // ✅ 상세보기 버튼 클릭 시 이동
  const onDetailButtonClick = (boardNumber: number) => {
    const url = `/board/detail/${boardNumber}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    getAdminBoardList();
  }, []);

  if (loading) return <div className="admin-board-list">불러오는 중...</div>;

  return (
    <div className="admin-board-list">
      <h2>📋 게시물 관리</h2>

      {viewList.length === 0 ? (
        <p>등록된 게시물이 없습니다.</p>
      ) : (
        <>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회수</th>
                <th>좋아요</th>
                <th>댓글수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {viewList.map((board, index) => (
                <tr key={board.boardNumber}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td title={board.title}>{board.title}</td>
                  <td>{board.writerEmail}</td>
                  <td>{board.writeDatetime}</td>
                  <td>{board.viewCount}</td>
                  <td>{board.favoriteCount}</td>
                  <td>{board.commentCount}</td>
                  <td className="action-buttons">
                    <button
                      className="admin-btn update"
                      onClick={() => onDetailButtonClick(board.boardNumber)}
                    >
                      상세보기
                    </button>
                    <button
                      className="admin-btn delete"
                      onClick={() => {
                        setTargetBoard(board.boardNumber);
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

          {/* ✅ 페이지네이션 UI */}
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
        </>
      )}

      {/* ✅ 삭제 모달 */}
      {showDeleteModal && (
        <DeleteConfirmModal
          message={`해당 게시물을 삭제하시겠습니까?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBoard}
        />
      )}
    </div>
  );
}
