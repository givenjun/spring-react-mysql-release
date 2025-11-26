import React, { useEffect, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./genericModal.css";

interface GenericModalProps {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  danger?: boolean;

  roundedOverlay?: boolean;
  cardSelector?: string;

  children?: React.ReactNode;
}

export default function GenericModal({
  title = "알림",
  message = "",
  confirmText = "확인",
  cancelText = "취소",
  showCancel = true,
  danger = false,
  roundedOverlay = false,
  cardSelector = "",
  children,
  onConfirm,
  onCancel,
}: GenericModalProps) {
  
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  /** 🔥 카드 기반 overlay 위치 계산 */
  useLayoutEffect(() => {
    if (!roundedOverlay || !cardSelector) return;

    const card = document.querySelector(cardSelector) as HTMLElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    setOverlayStyle({
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: "12px",
      overflow: "hidden",           // 깜빡임 방지
      zIndex: 9999,
    });
  }, [roundedOverlay, cardSelector]);

  /** 🔥 클릭 제어 */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel && onCancel();
  };

  /** 🔥 실제 렌더링 부분 */
  const modalLayout = (
    <div
      className={`modal-overlay ${roundedOverlay ? "rounded-overlay" : ""}`}
      style={roundedOverlay ? overlayStyle : {}}
      onClick={handleOverlayClick}
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {title && <h3>{title}</h3>}

        {/* children 우선, message fallback */}
        {children ? children : message && <p>{message}</p>}

        <div className="modal-actions">
          {showCancel && (
            <button className="cancel-btn" onClick={onCancel}>
              {cancelText}
            </button>
          )}

          <button
            className={`confirm-btn ${danger ? "danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalLayout, document.body);
}
