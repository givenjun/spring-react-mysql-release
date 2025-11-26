import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import "../common/style.css";
import axios from "axios";
import useAdminAuth from "hooks/useadminauth.hook";
import { customErrToast } from "hooks";

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

  const [showAddStrict, setShowAddStrict] = useState(false);
  const [showAddLoose, setShowAddLoose] = useState(false);
  const [showAddRegex, setShowAddRegex] = useState(false);

  const [newStrictWord, setNewStrictWord] = useState("");
  const [newLooseWord, setNewLooseWord] = useState("");
  const [newRegexWord, setNewRegexWord] = useState("");

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

  useEffect(() => {
    getBadwordList();
  }, []);

  const isUploadDisabled = !strictFile && !looseFile && !regexFile;

  // 추가 함수
  const addStrict = () => {
    if (!newStrictWord.trim()) return;
    setStrict((prev) => [...prev, newStrictWord.trim()]);
    setNewStrictWord("");
    setShowAddStrict(false);
  };

  const addLoose = () => {
    if (!newLooseWord.trim()) return;
    setLoose((prev) => [...prev, newLooseWord.trim()]);
    setNewLooseWord("");
    setShowAddLoose(false);
  };

  const addRegex = () => {
    if (!newRegexWord.trim()) return;
    setRegex((prev) => [...prev, newRegexWord.trim()]);
    setNewRegexWord("");
    setShowAddRegex(false);
  };

  if (loading) return <div className="badword-page">불러오는 중...</div>;

  return (
    <div className="admin-badword-list">
    <div className="badword-page">
      <h2 className="badword-title">🚫 비속어 관리</h2>

      <div className="badword-grid">

        {/* 업로드 카드 */}
        <div className="badword-card badword-upload">
          <h3>📤 파일 업로드</h3>

          <div className="badword-upload-row">
            <label>Strict 파일</label>
            <input ref={strictRef} type="file" onChange={(e) => setStrictFile(e.target.files?.[0] || null)} />
          </div>

          <div className="badword-upload-row">
            <label>Loose 파일</label>
            <input ref={looseRef} type="file" onChange={(e) => setLooseFile(e.target.files?.[0] || null)} />
          </div>

          <div className="badword-upload-row">
            <label>Regex 파일</label>
            <input ref={regexRef} type="file" onChange={(e) => setRegexFile(e.target.files?.[0] || null)} />
          </div>

          <button
            disabled={isUploadDisabled}
            className={`badword-btn ${isUploadDisabled ? "disabled" : ""}`}
            onClick={uploadBadwordFiles}
          >
            업로드
          </button>
        </div>

        {/* STRICT */}
        <div className="badword-card badword-list-card">
          <h3>🔴 Strict 리스트 ({strict.length})</h3>

          <div className="badword-badge-container">
            {strict.map((word, idx) => (
              <span key={idx} className="badword-badge badword-strict">{word}</span>
            ))}
          </div>

          {showAddStrict && (
            <div className="add-row">
              <input
                type="text"
                value={newStrictWord}
                onChange={(e) => setNewStrictWord(e.target.value)}
                placeholder="단어 입력"
              />
              <button onClick={addStrict}>추가</button>
            </div>
          )}

          <button className="add-bottom-btn" onClick={() => setShowAddStrict(!showAddStrict)}>
            + 단어 추가
          </button>
        </div>

        {/* LOOSE */}
        <div className="badword-card badword-list-card">
          <h3>🟡 Loose 리스트 ({loose.length})</h3>

          <div className="badword-badge-container">
            {loose.map((word, idx) => (
              <span key={idx} className="badword-badge badword-loose">{word}</span>
            ))}
          </div>

          {showAddLoose && (
            <div className="add-row">
              <input
                type="text"
                value={newLooseWord}
                onChange={(e) => setNewLooseWord(e.target.value)}
                placeholder="단어 입력"
              />
              <button onClick={addLoose}>추가</button>
            </div>
          )}

          <button className="add-bottom-btn" onClick={() => setShowAddLoose(!showAddLoose)}>
            + 단어 추가
          </button>
        </div>

        {/* REGEX */}
        <div className="badword-card badword-list-card">
          <h3>🟣 Regex 리스트 ({regex.length})</h3>

          <div className="badword-badge-container">
            {regex.map((pattern, idx) => (
              <span key={idx} className="badword-badge badword-regex">{pattern}</span>
            ))}
          </div>

          {showAddRegex && (
            <div className="add-row">
              <input
                type="text"
                value={newRegexWord}
                onChange={(e) => setNewRegexWord(e.target.value)}
                placeholder="정규식 입력"
              />
              <button onClick={addRegex}>추가</button>
            </div>
          )}

          <button className="add-bottom-btn" onClick={() => setShowAddRegex(!showAddRegex)}>
            + 정규식 추가
          </button>
        </div>

      </div>
    </div>
    </div>
  );
}
