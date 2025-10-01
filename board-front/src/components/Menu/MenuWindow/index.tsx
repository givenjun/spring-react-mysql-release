import ChatWindow from 'components/ChatBot';
import './style.css';
import { useState } from 'react';
import ChatIcon from 'assets/image/chat-light.png'
import MenuHome from '../MenuHome';
import HomeIcon from 'assets/image/home-icon.png'

export default function MenuWindow() {

    const [activeTab, setActiveTab] = useState<string>('home');

    const homeClickHandler = () => {
        setActiveTab('home');
    }

    const chatClickHandler = () => {
        setActiveTab('chat');
    }
    
    const relatedPostHandler =() => {
        setActiveTab('relativePost');
    }
    return (
        <div className='menu-window-container'>
            <div className='menu-window-header'>
                <p>Route Pick</p>
            </div>
            {activeTab === 'home' && <MenuHome/>}
            {activeTab === 'chat' && <ChatWindow/>}
            <div className='menu-window-footer'>
                <div className='navigate-menu-home' onClick={homeClickHandler}>
                    <img src={HomeIcon} style={{width:'24px', height:'auto'}}></img>
                    <div>홈</div>
                </div>
                <div className='navigate-menu-chat' onClick={chatClickHandler}>
                    <img src={ChatIcon} style={{width: '24px'}}></img>
                    <div>대화</div>
                </div>
                <div className='navigate-menu-config' onClick={relatedPostHandler}>
                    <p style={{margin:0}}>연관</p>
                    <p style={{margin:0}}>게시물</p>
                </div>
            </div>
        </div>
    )
}