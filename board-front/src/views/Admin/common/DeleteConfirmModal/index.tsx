import React from "react";
import "./style.css";

interface DeleteConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
        <h3>⚠️ 삭제 확인</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            취소
          </button>
          <button className="confirm-btn delete" onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
