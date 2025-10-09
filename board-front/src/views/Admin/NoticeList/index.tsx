import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";
import NoticeModal from "./NoticeModal";

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
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

    // ✅ 공지 목록 불러오기
    const getAdminNoticeList = async () => {
        try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${DOMAIN}/api/v1/notice`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const { code, noticeList } = response.data;
        if (code === "SU") setNotices(noticeList);
        else customErrToast("공지사항 목록을 불러오지 못했습니다.");
        } catch (error) {
        console.error(error);
        customErrToast("공지 목록 요청 중 오류가 발생했습니다.");
        } finally {
        setLoading(false);
        }
    };

    // ✅ 공지 삭제
    const deleteNotice = async (id: number) => {
        if (!window.confirm("이 공지를 삭제하시겠습니까?")) return;

        try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.delete(`${DOMAIN}/api/v1/notice/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const { code } = response.data;
        if (code === "SU") {
            setNotices((prev) => prev.filter((n) => n.id !== id));
            customErrToast("공지사항이 삭제되었습니다.");
        } else {
            customErrToast("삭제 실패. 다시 시도해주세요.");
        }
        } catch (error) {
        console.error(error);
        customErrToast("삭제 중 오류가 발생했습니다.");
        }
    };

    // 👇 파일 상단 (컴포넌트 바깥 또는 안쪽 제일 위에 추가)
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


    useEffect(() => {
        getAdminNoticeList();
    }, []);

    if (loading) return <div className="admin-notice-list">로딩 중...</div>;

    return (
        <div className="admin-notice-list">
        <div className="admin-notice-header">
            <h2>📢 공지사항 관리</h2>
            <button
            className="add-btn"
            onClick={() => {
                setSelectedNotice(null);
                setShowModal(true);
            }}
            >
            ＋
            </button>
        </div>

        {notices.length === 0 ? (
            <p>등록된 공지가 없습니다.</p>
        ) : (
            <table>
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
                {notices.map((notice, index) => (
                <tr key={notice.id}>
                    <td>{notice.pinned ? "📌" : "-"}</td>
                    <td>{index + 1}</td>
                    <td>{notice.title}</td>
                    <td>{formatDate(notice.createdAt)}</td>
                    <td>{formatDate(notice.updatedAt)}</td>
                    <td>
                    <button
                        className="update-btn"
                        onClick={() => {
                        setSelectedNotice(notice);
                        setShowModal(true);
                        }}
                    >
                        수정
                    </button>
                    <button
                        className="delete-btn"
                        onClick={() => deleteNotice(notice.id)}
                    >
                        삭제
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}

        {/* ✅ 작성 / 수정 모달 */}
        {showModal && (
            <NoticeModal
            notice={selectedNotice}
            onClose={() => setShowModal(false)}
            onSuccess={getAdminNoticeList}
            />
        )}
        </div>
    );
}
