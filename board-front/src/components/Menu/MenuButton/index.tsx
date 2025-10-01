import React, { useState } from 'react';
import ChatBotIcon from 'assets/image/chatbot-icon.png';
import CloseButtonIcon from 'assets/image/close-button-icon.png';
import './style.css';
import MenuWindow from '../MenuWindow';
// import ChatWindow from 

//        component: ChatBotButton 컴포넌트           //
export default function MenuButton() {

  //      state: ChatBotButton 메뉴 오픈 상태 변수      //
  const [isOpen, setIsOpen] = useState<boolean>(false);

  //      event handler: ChatBotButton 클릭 이벤트 처리 함수    //
  const onClickHandler = () => {
    setIsOpen(!isOpen);
  };

  //      render: ChatBotButton 컴포넌트 렌더링         //
  return (
    <>
    {isOpen && <MenuWindow/>}
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