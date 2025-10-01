import React, { useEffect, useState } from 'react';
import ChatBotIcon from 'assets/image/chatbot-icon.png';
import CloseButtonIcon from 'assets/image/close-button-icon.png';
import './style.css';
import MenuWindow from '../MenuWindow';
import CTA from 'components/CTA';

//        component: MenuButton 컴포넌트           //
export default function MenuButton() {

  //      state: MenuButton 메뉴 오픈 상태 변수      //
  const [isOpen, setIsOpen] = useState<boolean>(false);
  //      state: CTA 표시 상태 변수      //
  const [isCtaVisible, setIsCtaVisible] = useState<boolean>(false);

  const CTA_CLOSED_TIMESTAMP_KEY = 'ctaClosedTimestamp';
  const HIDE_DURATION = 24 * 60 * 60 * 1000;

  //      effect: 컴포넌트 마운트 시 CTA 표시 여부 결정           //
  useEffect (() => {
    const closedTimestamp = localStorage.getItem(CTA_CLOSED_TIMESTAMP_KEY);

    if (!closedTimestamp) {
      setIsCtaVisible(true);
      return;
    }

    const is24HoursPassed = Date.now() - Number(closedTimestamp) > HIDE_DURATION;

    if (is24HoursPassed) {
      setIsCtaVisible(true);
    }
  }, []);

  //      event handler: MenuButton 클릭 이벤트 처리 함수    //
  const onClickHandler = () => {
    if (!isOpen && isCtaVisible) {
      localStorage.setItem(CTA_CLOSED_TIMESTAMP_KEY, String(Date.now()));
      setIsCtaVisible(false);
    }
    setIsOpen(!isOpen);
  };

  //      event handler: CTA 닫기 버튼 클릭 이벤트 처리 함수    //
  const onCtaCloseClickHandler = () => {
    localStorage.setItem(CTA_CLOSED_TIMESTAMP_KEY, String(Date.now()));
    setIsCtaVisible(false);
  };

  //      render: MenuButton 컴포넌트 렌더링         //
  return (
    <>
    {isOpen && <MenuWindow/>}
    {isCtaVisible && 
    <div onClick={onClickHandler}>
      <CTA onClose={onCtaCloseClickHandler}/>
    </div>}
    <div className='chat-bot-button-container' style={{ backgroundColor: isOpen ? '#ffffff' : '#c295fe' }} onClick={onClickHandler}>
      <img className='chat-bot-button-icon'
        src={isOpen ? CloseButtonIcon : ChatBotIcon}
        style={{
          width: isOpen ? '50%' : '75%',
          }}
      />
    </div>
    </>
  )
}