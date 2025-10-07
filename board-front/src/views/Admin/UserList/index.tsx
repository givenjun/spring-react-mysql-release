import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";

interface User {
  email: string;
  nickname: string;
  telNumber: string;
  role: "USER" | "ADMIN";
}

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminUserList() {
  useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    getAdminUserList();
  }, []);

  if (loading) return <div className="admin-user-list">로딩 중...</div>;

  return (
    <div className="admin-user-list">
      <div className="admin-user-header">
        <h2>👥 회원 관리</h2>
        {/* <button className="add-btn">+</button> */}
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
                    onClick={() => deleteUser(user.email)}
                  >
                    변경하기
                  </button>
                </td>
                <td>{user.nickname}</td>
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
    </div>
  );
}
