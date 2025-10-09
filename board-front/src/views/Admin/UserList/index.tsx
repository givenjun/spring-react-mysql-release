import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";

interface User {
  email: string;
  nickname: string;
  telNumber: string;
  emailVerified: boolean;
  role: "USER" | "ADMIN";
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminUserList() {
  useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ✅ 회원 목록 불러오기
  const getAdminUserList = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${DOMAIN}/api/v1/admin/user-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code, userList } = response.data;
      if (code === "SU") setUsers(userList);
      else customErrToast("회원 목록을 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      customErrToast("회원 목록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회원 삭제 함수
  const deleteUser = async (email: string) => {
    if (!window.confirm(`${email} 사용자를 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(`${DOMAIN}/api/v1/admin/user/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code } = response.data;
      if (code === "SU") {
        setUsers((prev) => prev.filter((u) => u.email !== email));
        customErrToast("회원이 삭제되었습니다.");
      } else {
        customErrToast("삭제 실패. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error(error);
      customErrToast("삭제 중 오류가 발생했습니다.");
    }
  };

  // ✅ 비밀번호 변경 요청
  const updateUserPassword = async () => {
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
  }, []);

  if (loading) return <div className="admin-user-list">로딩 중...</div>;

  return (
    <div className="admin-user-list">
      <div className="admin-user-header">
        <h2>👥 회원 관리</h2>
      </div>

      {users.length === 0 ? (
        <p>등록된 회원이 없습니다.</p>
      ) : (
        <table>
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
            {users.map((user, index) => (
              <tr key={user.email}>
                <td>{index + 1}</td>
                <td>{user.email}</td>
                <td>
                  <button
                    className="update-btn"
                    onClick={() => {
                      setSelectedEmail(user.email);
                      setShowModal(true);
                    }}
                  >
                    변경하기
                  </button>
                </td>
                <td>{user.nickname}</td>
                <td> {user.emailVerified ? "✅ 인증됨" : "❌ 미인증"}</td>
                <td>
                  <span
                    className={`role-badge ${
                      user.role === "ADMIN" ? "admin" : "user"
                    }`}
                  >
                    {user.role === "ADMIN" ? "ROLE_ADMIN" : "ROLE_USER"}
                  </span>
                </td>
                <td>{user.telNumber}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteUser(user.email)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ 비밀번호 변경 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>🔐 비밀번호 변경</h3>
            <p>{selectedEmail}</p>
            <input
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button className="confirm-btn" onClick={updateUserPassword}>
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
