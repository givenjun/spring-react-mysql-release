import React, { useState, useEffect } from "react";
import axios from "axios";
import { customErrToast } from "hooks";

const DOMAIN = process.env.REACT_APP_API_URL;

interface Props {
  notice: {
    id: number;
    title: string;
    content: string;
    pinned: boolean;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NoticeModal({ notice, onClose, onSuccess }: Props) {
  const isEdit = Boolean(notice);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setPinned(notice.pinned);
    } else {
      setTitle("");
      setContent("");
      setPinned(false);
    }
  }, [notice]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      customErrToast("제목과 내용을 모두 입력하세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const url = isEdit
        ? `${DOMAIN}/api/v1/notice/admin/${notice!.id}`
        : `${DOMAIN}/api/v1/notice/admin`;
      const method = isEdit ? "patch" : "post";

      await axios({
        method,
        url,
        data: { title, content, pinned },
        headers: { Authorization: `Bearer ${token}` },
      });

      customErrToast(isEdit ? "공지 수정 완료!" : "공지 등록 완료!");
      onClose();
      onSuccess();
    } catch (error) {
      console.error(error);
      customErrToast("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>{isEdit ? "✏️ 공지 수정" : "📝 새 공지 작성"}</h3>

        <input
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          상단 고정
        </label>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="confirm-btn" onClick={handleSave}>
            {isEdit ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
