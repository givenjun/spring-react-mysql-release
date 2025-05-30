import React, { SetStateAction,Dispatch } from 'react'
import './style.css';

//          interface: 페이지네이션 컴포넌트 Properties          //
interface Props{
  currentPage: number;
  currentSection: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setCurrentSection: Dispatch<SetStateAction<number>>;

  viewPageList: number[];
  totalSection: number;
}
//          component: 페이지네이션 컴포넌트          //
export default function Pagination(props: Props) {

  //          state: Properties          //
  const {currentPage, currentSection, viewPageList, totalSection} = props;
  const {setCurrentPage, setCurrentSection} = props;

  //          event handler: 페이지 클릭 이벤트 처리          //
  const onPageClickhandler = (page: number) => {
    //console.log("페이지 번호 클릭:", page); // 추가
    setCurrentPage(page);
  }
  //          event handler: 이전 클릭 이벤트 처리          //
  const onPreviousClickhandler = () => {
    //console.log("이전 버튼 클릭됨!"); // <<----- 이 부분 추가

    if(currentSection === 1) return;
    setCurrentPage((currentSection -1) *10);
    setCurrentSection(currentSection - 1);//2025-05-25 PM:11

    // if (currentSection === 1) {
    //   console.log("현재 첫 번째 섹션입니다. 이전으로 이동할 수 없습니다."); // 추가
    //   return;
    // };
    // const newSection = currentSection - 1;
    // setCurrentSection(newSection);
    // console.log("setCurrentSection 호출: 새로운 섹션", newSection); // 추가

    //setCurrentPage((newSection - 1) * 10 + 1);
  }
  //          event handler: 다음 클릭 이벤트 처리          //
  const onNextClickhandler = () => {

    if(currentSection === totalSection) return;
    setCurrentPage(currentSection*10 + 1);
    setCurrentSection(currentSection + 1);//2025-05-25 PM:
    
    // console.log("다음 버튼 클릭됨!"); // <<----- 이 부분 추가
    // if (currentSection === totalSection) {
    //   console.log("현재 마지막 섹션입니다. 다음으로 이동할 수 없습니다."); // 추가
    //   return;
    // }
    // const newSection = currentSection + 1;
    // setCurrentSection(newSection);
    
    //setCurrentPage((newSection - 1) * 10 + 1);
  }
  //          render: 페이지네이션 컴포넌트 렌더링          //
  return (
    <div id='pagination-wrapper'>
      <div className='pagination-change-link-box'>
        <div className='icon-box-small'>
          <div className='icon expand-left-icon'></div>
        </div>
        <div className='pagination-change-link-text' onClick={onPreviousClickhandler}>{'이전'}</div>
      </div>
      <div className='pagination-divider'>{'\|'}</div>

      {viewPageList.map(page => 
      page === currentPage ? 
      <div className='pagination-text-active'>{page}</div> :
      <div className='pagination-text' onClick={() =>onPageClickhandler(page)}>{page}</div>
      )}
      <div className='pagination-divider'>{'\|'}</div> 
      <div className='pagination-change-link-box'>
        <div className='pagination-change-link-text' onClick={onNextClickhandler}>{'다음'}</div>
        <div className='icon-box-small'>
          <div className='icon expand-right-icon'></div>
        </div>
      </div>   
    </div>
  )
}
