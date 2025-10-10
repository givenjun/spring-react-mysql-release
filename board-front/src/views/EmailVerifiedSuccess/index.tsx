import React from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

export default function EmailVerifiedSuccess() {
  const navigate = useNavigate();

  const onLoginButtonClick = () => {
    navigate('/auth'); // 로그인 화면 경로에 맞춰 수정하세요
  };

  return (
    <div className="email-verify-wrapper">
      <div className="email-verify-container">
        <div className="email-verify-title">✅ 이메일 인증 완료</div>
        <div className="email-verify-message">
          이메일 인증이 정상적으로 완료되었습니다.<br />
          이제 로그인하여 서비스를 이용하실 수 있습니다.
        </div>
        <div className="black-large-full-button" onClick={onLoginButtonClick}>
          로그인하러 가기
        </div>
      </div>
    </div>
  );
}
