import React from "react";
import "./style.css";

interface RestoreConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestoreConfirmModal({
  message,
  onConfirm,
  onCancel,
}: RestoreConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-container restore-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🔃 복구 확인</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            취소
          </button>
          <button className="confirm-btn restore" onClick={onConfirm}>
            복구
          </button>
        </div>
      </div>
    </div>
  );
}
