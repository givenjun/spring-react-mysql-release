import ChatWindow from 'components/ChatBot';
import './style.css';
import { useCallback, useEffect, useState } from 'react';
import ChatIcon from 'assets/image/chat-icon.png'
import MenuHome from '../MenuHome';
import HomeIcon from 'assets/image/home-icon.png'
import { BoardListItem } from 'types/interface';
import { useNavigate } from 'react-router-dom';
import { getSearchBoardListRequest } from 'apis';
import RelatedPostsSidebar from 'components/RelatedPostsSidebar';
import useRelativeStore from 'stores/relativeStore';

const BOARD_DETAIL_PATH = '/board/detail';

function toBoardListItems(res: any): BoardListItem[] {
    if (!res) return [];
    const payload = (res && typeof res === 'object' && 'code' in res && 'data' in res) ? (res as any).data : res;
    const list =
      (Array.isArray(payload?.boardList) && payload.boardList) ||
      (Array.isArray(payload?.searchList) && payload.searchList) ||
      (Array.isArray(payload?.list) && payload.list) ||
      (Array.isArray(payload?.result) && payload.result) ||
      (Array.isArray(payload?.rows) && payload.rows) ||
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload) && payload) ||
      [];
    return (list as any[]).map((it: any) => ({
      boardNumber: it.boardNumber ?? it.id ?? it.board_id,
      title: it.title ?? '(제목 없음)',
      content: typeof it?.content === 'string' ? it.content : (typeof it?.text === 'string' ? it.text : ''),
    })) as BoardListItem[];
}

export default function MenuWindow() {

    const selectedPlaceName = useRelativeStore((state) => state.selectedPlaceName);

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>('home');
    const [relatedPosts, setRelatedPosts] = useState<BoardListItem[]>([]);
    const [relatedLoading, setRelatedLoading] = useState<boolean>(false);
    const [relatedError, setRelatedError] = useState<string | null>(null);
 
    const loadRelatedPosts = useCallback(async (keyword: string) =>  {
        if (!keyword) return;
        setRelatedLoading(true);
        setRelatedError(null);
        try {
            const res = await getSearchBoardListRequest(keyword.trim(), null);
            const list = toBoardListItems(res);

            setRelatedPosts(list);
        } catch {
            setRelatedError('연관 게시물을 불러오지 못했습니다.');
            setRelatedPosts([]);
        } finally {
            setRelatedLoading(false);
        }
    }, []);

    // useEffect(() => {
    //     if (selectedPlaceName) {
    //         setActiveTab('relatedPost');
    //         loadRelatedPosts(selectedPlaceName);
    //     }
    // }, [selectedPlaceName, loadRelatedPosts]);

    const handleOpenPost = useCallback((boardNumber: string | number) => {
        if (boardNumber === undefined || boardNumber === null) return;
        navigate(`${BOARD_DETAIL_PATH}/${boardNumber}`);
    }, [navigate]);

    const homeClickHandler = () => {
        setActiveTab('home');
    }

    const chatClickHandler = () => {
        setActiveTab('chat');
    }
    
    const relatedPostHandler =() => {
        setActiveTab('relativePost');

        if (selectedPlaceName) {
            loadRelatedPosts(selectedPlaceName);
        }
    }
    
    return (
        <div className='menu-window-container'>
            <div className='menu-window-header'>
                <p>Route Pick</p>
            </div>
            {activeTab === 'home' && <MenuHome/>}
            {activeTab === 'chat' && <ChatWindow/>}
            {activeTab === 'relativePost' && (
                <RelatedPostsSidebar
                    placeName={selectedPlaceName}
                    relatedPosts={relatedPosts}
                    loading={relatedLoading}
                    error={relatedError}
                    open={true}
                    onClose={homeClickHandler}
                    onClickPost={handleOpenPost}
                />
            )}
            <div className='menu-window-footer'>
                <div className='navigate-menu-home' onClick={homeClickHandler}>
                    <img src={HomeIcon} style={{width:'16px', height:'auto'}}></img>
                    <div>홈</div>
                </div>
                <div className='navigate-menu-chat' onClick={chatClickHandler}>
                    <img src={ChatIcon} style={{width: '16px'}}></img>
                    <div>채팅</div>
                </div>
                <div className='navigate-menu-config' onClick={relatedPostHandler}>
                    <p style={{margin:0}}>연관</p>
                    <p style={{margin:0}}>게시물</p>
                </div>
            </div>
        </div>
    )
}