import React, { useEffect, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { jwtDecode } from "jwt-decode";
import { customErrToast, usePagination } from "hooks";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import RestoreConfirmModal from "./RestoreConfirmModal";

interface User {
  deleted: boolean;
  email: string;
  nickname: string;
  telNumber: string;
  emailVerified: boolean;
  role: "USER" | "ADMIN" | "SUB_ADMIN";
}

interface JwtPayload {
  role: "ADMIN" | "SUB_ADMIN";
  exp?: number;
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminUserList() {
  useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"ADMIN" | "SUB_ADMIN" | null>(null);

  // ✅ 페이지네이션 훅 (페이지당 10명씩)
  const {
    currentPage,
    setCurrentPage,
    currentSection,
    setCurrentSection,
    viewList,
    viewPageList,
    totalSection,
    setTotalList,
  } = usePagination<User>(10);

  // ✅ 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");

  // ✅ 토큰에서 role 추출
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserRole(decoded.role);
    } catch {
      setUserRole(null);
    }
  }, []);

  // ✅ 회원 목록 불러오기
  const getAdminUserList = async () => {
    if (userRole === "SUB_ADMIN") {
      customErrToast("부관리자는 회원 목록을 볼 수 없습니다.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${DOMAIN}/api/v1/admin/user-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code, userList } = response.data;
      if (code === "SU") setTotalList(userList);
      else customErrToast("회원 목록을 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      customErrToast("회원 목록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 관리자 권한 확인 함수
  const checkAdminPermission = (): boolean => {
    if (userRole !== "ADMIN") {
      customErrToast("관리자만 가능한 기능입니다.");
      return false;
    }
    return true;
  };

  // ✅ 회원 삭제
  const confirmDeleteUser = async () => {
    if (!checkAdminPermission()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(`${DOMAIN}/api/v1/admin/user/${targetEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code } = response.data;
      if (code === "SU") {
        getAdminUserList();
        customErrToast("회원이 삭제되었습니다.");
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

  // ✅ 회원 복구
  const confirmRestoreUser = async () => {
    if (!checkAdminPermission()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(`${DOMAIN}/api/v1/admin/user/restore/${targetEmail}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code } = response.data;
      if (code === "SU") {
        getAdminUserList();
        customErrToast("회원이 복구되었습니다.");
      } else {
        customErrToast("복구 실패. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error(error);
      customErrToast("복구 중 오류가 발생했습니다.");
    } finally {
      setShowRestoreModal(false);
    }
  };

  // ✅ 비밀번호 변경
  const updateUserPassword = async () => {
    if (!checkAdminPermission()) return;

    if (!newPassword || newPassword.length < 8) {
      customErrToast("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.patch(
        `${DOMAIN}/api/v1/admin/user/${selectedEmail}/password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { code } = response.data;
      if (code === "SU") {
        customErrToast("비밀번호가 성공적으로 변경되었습니다.");
        setShowModal(false);
        setNewPassword("");
      } else {
        customErrToast("비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      customErrToast("비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    getAdminUserList();
  }, [userRole]);

  if (loading) return <div className="admin-user-list">로딩 중...</div>;

  return (
    <div className="admin-user-list">
      <div className="admin-user-header">
        <h2>👥 회원 관리</h2>
      </div>

      {userRole === "SUB_ADMIN" ? (
        <p>부관리자는 회원 관리 기능을 이용할 수 없습니다.</p>
      ) : viewList.length === 0 ? (
        <p>등록된 회원이 없습니다.</p>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>이메일</th>
                  <th>비밀번호</th>
                  <th>닉네임</th>
                  <th>이메일 인증</th>
                  <th>권한</th>
                  <th>전화번호</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {viewList.map((user, index) => (
                  <tr className={user.deleted ? "deleted-user" : ""} key={user.email}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>{user.email}</td>
                    <td className="action-buttons">
                      {user.deleted ? (
                        <button
                          className="admin-btn"
                        >
                          변경하기
                        </button>
                      ) : (
                        <button
                        className="admin-btn update"
                        onClick={() => {
                          setSelectedEmail(user.email);
                          setShowModal(true);
                        }}
                      >
                        변경하기
                      </button>
                      )}
                    </td>
                    <td>{user.nickname}</td>
                    <td>{user.emailVerified ? "✅ 인증됨" : "❌ 미인증"}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          user.role === "ADMIN" ? "admin" : user.role === "SUB_ADMIN" ? "subadmin" : "user"
                        }`}
                      >
                        {user.role === "ADMIN" ? "ADMIN" : user.role === "SUB_ADMIN" ? "SUB_ADMIN" : "USER"}
                      </span>
                    </td>
                    <td>{user.telNumber}</td>
                    <td className="action-buttons">
                      {user.deleted ? (
                        <button
                          className="admin-btn restore"
                          onClick={() => {
                            setTargetEmail(user.email);
                            // 복구용 모달 띄우기 or 즉시 요청
                            setShowRestoreModal(true);
                          }}
                        >
                          복구하기
                        </button>
                      ) : (
                        <button
                          className="admin-btn delete"
                          onClick={() => {
                            setTargetEmail(user.email);
                            setShowDeleteModal(true);
                          }}
                        >
                          삭제하기
                        </button>
                      )}
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
      {showDeleteModal && (
        <DeleteConfirmModal
          message={`${targetEmail} 사용자를 삭제하시겠습니까?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteUser}
        />
      )}
      {showRestoreModal && (
        <RestoreConfirmModal
          message={`${targetEmail} 사용자를 복구하시겠습니까?`}
          onCancel={() => setShowRestoreModal(false)}
          onConfirm={confirmRestoreUser}
        />
      )}
    </div>
  );
}
