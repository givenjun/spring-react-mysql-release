import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";
import DeleteConfirmModal from "../common/DeleteConfirmModal"; // 🔥 모달 import
import GenericModal from "../../../components/Modal/GenericModal";

const DOMAIN = process.env.REACT_APP_API_URL;

export default function AdminBadwordList() {
  useAdminAuth();

  const [loading, setLoading] = useState(true);

  const [strict, setStrict] = useState<string[]>([]);
  const [loose, setLoose] = useState<string[]>([]);
  const [regex, setRegex] = useState<string[]>([]);

  const [strictFile, setStrictFile] = useState<File | null>(null);
  const [looseFile, setLooseFile] = useState<File | null>(null);
  const [regexFile, setRegexFile] = useState<File | null>(null);

  const strictRef = useRef<HTMLInputElement>(null);
  const looseRef = useRef<HTMLInputElement>(null);
  const regexRef = useRef<HTMLInputElement>(null);

  const [newStrictWord, setNewStrictWord] = useState("");
  const [newLooseWord, setNewLooseWord] = useState("");
  const [newRegexWord, setNewRegexWord] = useState("");

  // ------------------------------
  // 🔥 확인 모달 상태 추가
  // ------------------------------
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isUploadDisabled = !strictFile && !looseFile && !regexFile;

  // ------------------------------
  // 📌 목록 조회
  // ------------------------------
  const getBadwordList = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${DOMAIN}/api/v1/admin/badwords`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { code, strict, loose, regex } = response.data;
      if (code === "SU") {
        setStrict(strict);
        setLoose(loose);
        setRegex(regex);
      }
    } catch {
      customErrToast("비속어 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBadwordList();
  }, []);

  // ------------------------------
  // 📌 파일 업로드 (확인 후 실행)
  // ------------------------------
  const uploadBadwordFiles = async () => {
    try {
      const formData = new FormData();
      if (strictFile) formData.append("strict", strictFile);
      if (looseFile) formData.append("loose", looseFile);
      if (regexFile) formData.append("regex", regexFile);

      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${DOMAIN}/api/v1/admin/badwords/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.code === "SU") {
        customErrToast("업로드 완료");

        setStrictFile(null);
        setLooseFile(null);
        setRegexFile(null);

        if (strictRef.current) strictRef.current.value = "";
        if (looseRef.current) looseRef.current.value = "";
        if (regexRef.current) regexRef.current.value = "";

        getBadwordList();
      }
    } catch {
      customErrToast("업로드 중 오류 발생");
    }
  };

  // ------------------------------
  // 📌 전체 초기화 (확인 후 실행)
  // ------------------------------
  const resetAll = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `${DOMAIN}/api/v1/admin/badwords/reset`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.code === "SU") {
        customErrToast("초기화 완료");
        getBadwordList();
      }
    } catch {
      customErrToast("초기화 실패");
    }
  };

  // -------------------------
// 📌 단어 추가 API 호출
// -------------------------
const handleAddWord = async (type: string, word: string) => {
  if (!word.trim()) return;

  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.post(
      `${DOMAIN}/api/v1/admin/badwords/add`,
      { type, word },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.code === "SU") {
      customErrToast("단어 추가 완료");
      getBadwordList();
    }
  } catch {
    customErrToast("단어 추가 실패");
  }
};

// -------------------------
// 📌 단어 삭제 API 호출
// -------------------------
const deleteWord = async (type: string, word: string) => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.delete(
      `${DOMAIN}/api/v1/admin/badwords/delete`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { type, word },
      }
    );

    if (response.data.code === "SU") {
      customErrToast("삭제 완료");
      getBadwordList();
    }
  } catch {
    customErrToast("삭제 실패");
  }
};

  if (loading) return <div className="badword-page">불러오는 중...</div>;

  return (
    <div className="admin-badword-list">
      <div className="badword-page">
        <h2 className="badword-title">🚫 비속어 관리</h2>

        {/* ---------------------------- */}
        {/* 🔥 전체 초기화 버튼 + 모달  */}
        {/* ---------------------------- */}
        <button className="reset-all-btn" onClick={() => setShowResetModal(true)}>
          ⚠ 전체 초기화
        </button>

        {showResetModal && (
          <GenericModal
            title="⚠️ 전체 초기화"
            message="모든 비속어 목록을 정말 초기화하시겠습니까?"
            confirmText="초기화"
            danger={true}
            onConfirm={() => {
              setShowResetModal(false);
              resetAll();
            }}
            onCancel={() => setShowResetModal(false)}
          />
        )}

        <div className="badword-grid">

          {/* ---------------------------- */}
          {/* 🔥 업로드 카드 + 업로드 확인 모달 */}
          {/* ---------------------------- */}
          <div className="badword-card badword-upload">
            <h3>📤 파일 업로드</h3>

            <div className="badword-upload-row">
              <label>Strict 파일</label>
              <input
                ref={strictRef}
                type="file"
                onChange={(e) => setStrictFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="badword-upload-row">
              <label>Loose 파일</label>
              <input
                ref={looseRef}
                type="file"
                onChange={(e) => setLooseFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="badword-upload-row">
              <label>Regex 파일</label>
              <input
                ref={regexRef}
                type="file"
                onChange={(e) => setRegexFile(e.target.files?.[0] || null)}
              />
            </div>

            <button
              disabled={isUploadDisabled}
              className={`badword-btn ${isUploadDisabled ? "disabled" : ""}`}
              onClick={() => setShowUploadModal(true)}
            >
              업로드
            </button>

            {showUploadModal && (
              <GenericModal
                title="📤 파일 업로드"
                message="선택한 파일을 업로드하시겠습니까?"
                confirmText="업로드"
                roundedOverlay={true}
                cardSelector=".badword-card"  // 🔥 카드 영역 지정
                onConfirm={() => {
                  setShowUploadModal(false);
                  uploadBadwordFiles();
                }}
                onCancel={() => setShowUploadModal(false)}
              />
            )}
          </div>

          {/* ---------------------------- */}
          {/* 아래 STRICT / LOOSE / REGEX 리스트 부분은 동일 */}
          {/* ---------------------------- */}

          <div className="badword-card badword-list-card">
            <h3>🔴 Strict 리스트 ({strict.length})</h3>

            <div className="add-row">
              <input
                type="text"
                value={newStrictWord}
                onChange={(e) => setNewStrictWord(e.target.value)}
                placeholder="단어 입력"
              />
              <button onClick={() => handleAddWord("strict", newStrictWord)}>추가</button>
            </div>

            <div className="badword-badge-container">
              {strict.map((word, idx) => (
                <span
                  key={idx}
                  className="badword-badge badword-strict"
                  onClick={() => deleteWord("strict", word)}
                >
                  {word} ✕
                </span>
              ))}
            </div>
          </div>

          <div className="badword-card badword-list-card">
            <h3>🟡 Loose 리스트 ({loose.length})</h3>

            <div className="add-row">
              <input
                type="text"
                value={newLooseWord}
                onChange={(e) => setNewLooseWord(e.target.value)}
                placeholder="단어 입력"
              />
              <button onClick={() => handleAddWord("loose", newLooseWord)}>추가</button>
            </div>

            <div className="badword-badge-container">
              {loose.map((word, idx) => (
                <span
                  key={idx}
                  className="badword-badge badword-loose"
                  onClick={() => deleteWord("loose", word)}
                >
                  {word} ✕
                </span>
              ))}
            </div>
          </div>

          <div className="badword-card badword-list-card">
            <h3>🟣 Regex 리스트 ({regex.length})</h3>

            <div className="add-row">
              <input
                type="text"
                value={newRegexWord}
                onChange={(e) => setNewRegexWord(e.target.value)}
                placeholder="정규식 입력"
              />
              <button onClick={() => handleAddWord("regex", newRegexWord)}>추가</button>
            </div>

            <div className="badword-badge-container">
              {regex.map((pattern, idx) => (
                <span
                  key={idx}
                  className="badword-badge badword-regex"
                  onClick={() => deleteWord("regex", pattern)}
                >
                  {pattern} ✕
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
