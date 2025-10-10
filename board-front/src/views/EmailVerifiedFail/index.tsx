import React from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

export default function EmailVerifiedFail() {
  const navigate = useNavigate();

  const onRetryButtonClick = () => {
    navigate('/auth'); // 로그인/회원가입 페이지로 이동
  };

  return (
    <div className="email-verify-wrapper">
      <div className="email-verify-container">
        <div className="email-verify-title" style={{ color: '#E53935' }}>
          ❌ 이메일 인증 실패
        </div>
        <div className="email-verify-message">
          유효하지 않거나 만료된 인증 링크입니다.<br />
          다시 회원가입하거나, 인증 메일을 재발송 해주세요.
        </div>
        <div className="black-large-full-button" onClick={onRetryButtonClick}>
          다시 시도하기
        </div>
      </div>
    </div>
  );
}
