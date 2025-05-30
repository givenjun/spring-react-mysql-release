import React from 'react';
import './style.css';
import profileImage from '../../profile_sample.png';
//import { BoardListItem } from 'types/interface';
import { useNavigate } from 'react-router-dom';
import defaultProfileImage from 'assets/image/default-profile-image.png';
import type { BoardListItem } from 'types/interface';
import { BOARD_DETAIL_PATH, BOARD_PATH } from 'constant';

interface Props {
    boardListItem: BoardListItem
}
//          component : Board List Item 컴포넌트          //
export default function BoardListItem({boardListItem}: Props) {
  //          properties          //
  const { boardNumber, title, content, boardTitleImage, imageCount } = boardListItem
  const { favoriteCount, commentCount, viewCount } = boardListItem
  const { writeDatetime, writerNickname, writerProfileImage } = boardListItem

  //          function: 네비게이트 함수          //
  const  navigate = useNavigate();

  //          event handler: 게시물 아이템 클릭 이벤트 처리 함수          //
  const onClickHandler = () => {
   navigate(BOARD_PATH() + '/' + BOARD_DETAIL_PATH(boardNumber));
  }

  //          render : Board List Item 컴포넌트 렌더링링          //
  return (
    <div className = 'board-list-item' onClick={onClickHandler}>
        <div className = 'board-list-item-main-box'>
            <div className = 'board-list-item-top'>
                <div className = 'board-list-item-profile-box'>
                    <div className = 'board-list-item-profile-image' style={{backgroundImage: `url(${writerProfileImage ? writerProfileImage:defaultProfileImage})`}}></div>
                </div>
                <div className = 'board-list-item-write-box'>
                    <div className = 'board-list-item-nickname'>{writerNickname}</div>
                    <div className = 'board-list-item-write-date'>{writeDatetime}</div>
                </div> 
            </div>
            <div className = 'board-list-item-middle'>
                <div className = 'board-list-item-tile'>{title}</div>
                <div className = 'board-list-item-content'>{content}</div>
            </div>
            <div className = 'board-list-item-bottom'>
                <div className = 'board-list-item-counts'>
                    {`댓글 ${commentCount} · 좋아요 ${favoriteCount} · 조회수 ${viewCount}`}
                </div>
            </div>  
        </div>
        {/*썸네일에 이미지가 몇개 더 있는지 알려주는 기능*/}
        {boardTitleImage !== null&& (
            <div className = 'board-list-item-image-box'>
            <div className = 'board-list-item-image' style={{backgroundImage: `url(${boardTitleImage})`}}></div>
             {/* ✨ 이미지 개수가 2개 이상일 때만 +N 표시 (썸네일 자체를 1개로 간주) */}
            {imageCount && imageCount > 1 && (
                <div className='board-list-item-image-count-badge'>
                    +{imageCount - 1} 
                </div>
            )}
        </div> )}
    </div>
  )
}