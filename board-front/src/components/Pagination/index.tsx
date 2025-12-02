import React, { SetStateAction, Dispatch, useState, useEffect } from 'react';
import './style.css';

interface Props {
  currentPage: number;
  currentSection: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setCurrentSection: Dispatch<SetStateAction<number>>;

  viewPageList: number[];
  totalSection: number;
}

export default function Pagination(props: Props) {

  const { currentPage, currentSection, viewPageList, totalSection } = props;
  const { setCurrentPage, setCurrentSection } = props;

  // ✨ [추가] 화면 크기가 모바일인지 확인하는 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✨ [추가] 화면 크기 변경 감지 리스너
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --------------------------------------------------------------------------
  // 💡 [핵심 로직] 모바일일 때 리스트를 반으로 쪼개기
  // --------------------------------------------------------------------------
  // 현재 섹션의 페이지가 10개(예: 1~10)라고 칠 때,
  // 모바일이면서 & 현재 페이지가 5보다 크면(예: 6,7,8...) -> '후반부(6~10)'로 간주
  // 그 외에는 -> '전반부(1~5)'로 간주
  const isSecondHalf = isMobile && viewPageList.length > 5 && currentPage > viewPageList[4];
  
  // 실제로 화면에 뿌릴 리스트 계산
  const renderPageList = isMobile 
    ? (isSecondHalf ? viewPageList.slice(5) : viewPageList.slice(0, 5)) // 모바일이면 5개씩 자름
    : viewPageList; // PC면 10개 다 보여줌

  // --------------------------------------------------------------------------
  // 버튼 핸들러
  // --------------------------------------------------------------------------
  const onPageClickhandler = (page: number) => {
    setCurrentPage(page);
  };

  const onPreviousClickhandler = () => {
    // 1. 모바일이고, 현재 '후반부(6~10)'를 보고 있다면 -> '전반부(1~5)'의 마지막 번호(5)로 이동
    if (isMobile && isSecondHalf) {
       setCurrentPage(viewPageList[4]); // 예: 5페이지로 이동
       return; 
    }

    // 2. 그 외(PC거나, 모바일 전반부)에는 원래 로직대로 '이전 섹션'으로 이동
    if (currentSection === 1) return;
    
    // 이전 섹션의 마지막 페이지(예: 10페이지)로 이동
    setCurrentPage((currentSection - 1) * 10);
    setCurrentSection(currentSection - 1);
  };

  const onNextClickhandler = () => {
    // 1. 모바일이고, 현재 '전반부(1~5)'를 보고 있고, 뒤에 페이지가 더 있다면 -> '후반부(6~10)'의 첫 번호(6)로 이동
    if (isMobile && !isSecondHalf && viewPageList.length > 5) {
      setCurrentPage(viewPageList[5]); // 예: 6페이지로 이동
      return;
    }

    // 2. 그 외에는 원래 로직대로 '다음 섹션'으로 이동
    if (currentSection === totalSection) return;

    setCurrentPage(currentSection * 10 + 1); // 예: 11페이지로 이동
    setCurrentSection(currentSection + 1);
  };

  return (
    <div id='pagination-wrapper'>
      {/* 이전 버튼 */}
      <div className='pagination-change-link-box'>
        <div className='icon-box-small'>
          <div className='icon expand-left-icon'></div>
        </div>
        <div className='pagination-change-link-text' onClick={onPreviousClickhandler}>{'이전'}</div>
      </div>
      
      <div className='pagination-divider'>{'\|'}</div>

      {/* 페이지 번호 리스트 (PC: 10개, 모바일: 5개) */}
      <div className='pagination-list'>
        {renderPageList.map(page => 
          page === currentPage ? 
          <div className='pagination-text-active' key={page}>{page}</div> :
          <div className='pagination-text' onClick={() => onPageClickhandler(page)} key={page}>{page}</div>
        )}
      </div>

      <div className='pagination-divider'>{'\|'}</div> 
      
      {/* 다음 버튼 */}
      <div className='pagination-change-link-box'>
        <div className='pagination-change-link-text' onClick={onNextClickhandler}>{'다음'}</div>
        <div className='icon-box-small'>
          <div className='icon expand-right-icon'></div>
        </div>
      </div>   
    </div>
  )
}