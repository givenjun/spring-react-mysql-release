import React, { useEffect, useState } from 'react'
import './style.css';
import { BoardListItem } from 'types/interface';
import Top3Item from 'components/Top3Item';
import BoardItem from 'components/BoardItem';
import Pagination from 'components/Pagination/';
import { useNavigate } from 'react-router-dom';
import { AUTH_PATH, BOARD_PATH, BOARD_WRITE_PATH, SEARCH_PATH } from 'constant';
import { getLatestBoardListRequest, getPopularListRequest, getTop3BoardListRequest } from 'apis';
import { GetLatestBoardListResponseDto, GetTop3BoardListResponseDto } from 'apis/response/board';
import { ResponseDto } from 'apis/response';
import { usePagination } from 'hooks';
import { GetPopularListResponseDto } from 'apis/response/search';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useLoginUserStore } from 'stores';

//          component: 게시판 화면 컴포넌트               //
export default function Notice() {

  
  //          render: 게시판 화면 컴포넌트 렌더링          //
  return (
    <>
      <div className='notice'>{`공지사항-미구현`}</div>
    </>
  )
}