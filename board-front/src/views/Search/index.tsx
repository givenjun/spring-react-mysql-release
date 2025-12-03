import { useNavigate, useParams } from 'react-router-dom'
import './style.css'
import { useEffect, useState } from 'react';
import { BoardListItem } from 'types/interface';
import BoardItem from 'components/BoardItem';
import { SEARCH_PATH } from 'constant';
import Pagination from 'components/Pagination';
import { GetRelationListRequest, getSearchBoardListRequest } from 'apis';
import { GetSearchBoardListResponseDto } from 'apis/response/board';
import { ResponseDto } from 'apis/response';
import { customErrToast, usePagination } from 'hooks';
import { GetRelationListResponseDto } from 'apis/response/search';

//          component: 검색 화면 컴포넌트          //
export default function Search() {

  //          function: 네비게이트 함수          //
  const navigate = useNavigate();

  //          state: searchWord path variable 상태          //
  const { searchWord } = useParams();
  //          state: 페이지네이션 관련 상태          //
  const {
          currentPage, currentSection, viewList, viewPageList, totalSection,
          setCurrentPage, setCurrentSection, setTotalList
      } = usePagination<BoardListItem>(5);
  //          state: 이전 검색어 상태          //
  const [preSearchWord, setPreSearchWord] = useState<string | null>(null);
  //          state: 검색 게시물 개수 상태          //
  const [count, setCount] = useState<number>(1);
  //          state: 검색 게시물 리스트 상태          //
  
  //          state: 연관 검색어 리스트 상태          //
  const [relativeWordList, setRelativeWordListt] = useState<string[]>([]);
  const [isRelativeOpen, setIsRelativeOpen] = useState<boolean>(false);

  const onRelativeWordToggleClickHandler = () => {
      setIsRelativeOpen(!isRelativeOpen);
    }

  //          event handler: 연관 검색어 클릭 이벤트 처리          //
  const onRelationWordClickHandler = (word: string) => {
    navigate(SEARCH_PATH(word));
  }

  //          function: get search board list response 처리 함수          //
  const getSearchBoardListResponse = (responseBody: GetSearchBoardListResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody;

    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;

    if (!searchWord) return;
    const { searchList } = responseBody as GetSearchBoardListResponseDto;
    setTotalList(searchList);
    setCount(searchList.length);
    setPreSearchWord(searchWord);
  }
  //          function: get relation list response 처리 함수          //
  const GetRelationListResponse = (responseBody: GetRelationListResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody;

    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;

    if (!searchWord) return;
    const { relativeWordList } = responseBody as GetRelationListResponseDto;
    setRelativeWordListt(relativeWordList);
  }

  //          effect: search word 상태 변경 시 실행될 함수          //
  useEffect(() => {
    if (!searchWord) return;
    getSearchBoardListRequest(searchWord, preSearchWord).then(getSearchBoardListResponse)
    GetRelationListRequest(searchWord).then(GetRelationListResponse)
  }, [searchWord]);

  //          render: 검색 화면 컴포넌트 렌더링          //
  if (!searchWord) return (<></>);
  return (
    <div id='search-wrapper'>
      <div className='search-container'>
        <div className='search-title-box'>
          <div className='search-title'><span className='search-title-emphasis'>{searchWord}</span>{`에 대한 검색 결과입니다.`}</div>
          <div className='search-count'>{count}</div>
        </div>
        <div className='search-contents-box'>
          {count === 0 ? 
          <div className='search-contents-nothing'>{`검색 결과가 없습니다.`}</div> :
          <div className='search-contents'>{viewList.map(boardListItem => <BoardItem boardListItem={boardListItem} />)}</div>
          }
          {/* -------- 연관 검색어 박스 -------- */}
        <div className='search-relation-box'>
          <div className='search-relation-card'>
            <div className='search-relation-card-container'>
              <div className='search-relation-card-title-box'>
                <div className='search-relation-card-title'>{'연관 검색어'}</div>

                {/* 🔥 펼치기 / 접기 버튼 */}
                {relativeWordList.length !== 0 && (
                  <div
                    className='search-relation-toggle-button'
                    onClick={() => setIsRelativeOpen(prev => !prev)}
                  >
                    {isRelativeOpen ? '접기 ▲' : '펼치기 ▼'}
                  </div>
                )}
              </div>

              {relativeWordList.length === 0 ? (
                <div className='search-relation-card-contents-nothing'>
                  연관 검색어가 없습니다.
                </div>
              ) : (
                <div
                  className={`search-relation-card-contents ${
                    isRelativeOpen ? 'open' : ''
                  }`}
                >
                  {relativeWordList.map(word => (
                    <div
                      key={word}
                      className='word-badge'
                      onClick={() => onRelationWordClickHandler(word)}
                    >
                      {word}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* -------- 연관 검색어 박스 끝 -------- */}
        </div>
        <div className='search-pagination-box'>
          {count !== 0 && 
          <Pagination
            currentPage={currentPage}
            currentSection={currentSection}
            setCurrentPage={setCurrentPage}
            setCurrentSection={setCurrentSection}
            viewPageList={viewPageList}
            totalSection={totalSection}
          />}
        </div>
      </div>
    </div>
  )
}