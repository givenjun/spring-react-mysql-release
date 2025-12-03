import { ChangeEvent, useEffect, useMemo, useRef, useState, memo } from 'react';
import './style.css';
import FavoriteItem from 'components/FavoriteItem';
import { Board, CommentListItem, FavoriteListItem } from 'types/interface';
import CommentItem from 'components/CommentItem';
import Pagination from 'components/Pagination';
import defaultProfileImage from 'assets/image/default-profile-image.png';
import { useLoginUserStore } from 'stores';
import { useNavigate, useParams } from 'react-router-dom';
import { BOARD_PATH, BOARD_UPDATE_PATH, USER_PATH } from 'constant';
import floatingHeartImg from 'assets/image/heart.png';
import {
  deleteBoardRequest,
  deleteCommentRequest,
  getBoardRequest,
  getCommentListRequest,
  getFavoriteListRequest,
  increaseViewCountRequest,
  postCommentRequest,
  putFavoriteRequest,
} from 'apis';
import {
  DeleteBoardResponseDto,
  GetBoardResponseDto,
  GetCommentListResponseDto,
  GetFavoriteListResponseDto,
  IncreaseViewCountResponseDto,
  PostCommentResponseDto,
  PutFavoriteResponseDto,
} from 'apis/response/board';
import { ResponseDto } from 'apis/response';

import dayjs from 'dayjs';
import { useCookies } from 'react-cookie';
import { PostCommentRequestDto } from 'apis/request/board';
import { customErrToast, usePagination } from 'hooks';
import RollingNumber from 'components/Rolling/RollingNumber';
import { toast } from 'react-toastify';
import InitRollingNumber from 'components/Rolling/initRolling/InitRollingNumber';

// ============================================================
// BoardDetailTop (memoized, independent component)
// ============================================================
interface BoardDetailTopProps {
  boardNumber: string;
  setViewCount: (n: number) => void;
  increasedOnce: boolean; // ✅ 현재 세션에서 이 게시글에 대해 조회수 증가 API를 이미 보냈는지
}

const BoardDetailTop = memo(function BoardDetailTop({ boardNumber, setViewCount, increasedOnce }: BoardDetailTopProps) {
  const navigate = useNavigate();
  const { loginUser } = useLoginUserStore();
  const [cookies] = useCookies();

  const [isWriter, setWriter] = useState<boolean>(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);

  const getWriteDatetimeFormat = () => {
    if (!board) return '';
    const date = dayjs(board.writeDatetime);
    return date.format('YYYY. MM. DD.');
  };

  // API: 게시글 조회 응답 처리
  const getBoardResponse = (responseBody: GetBoardResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') {
      navigate(BOARD_PATH());
      return;
    }

    const board: Board = { ...(responseBody as GetBoardResponseDto) };
    setBoard(board);

    // ✅ 최초 접속/새로고침 시 서버의 비동기 타이밍 때문에 표시가 1 낮게 보일 수 있어
    //    현재 세션에서 increase API를 이미 보냈다면 낙관적으로 +1 하여 표시
    setViewCount(board.viewCount + (increasedOnce ? 1 : 0));

    if (!loginUser) {
      setWriter(false);
      return;
    }
    setWriter(loginUser.email === board.writerEmail);
  };

  // API: 게시글 삭제 응답 처리
  const deleteBoardResponse = (responseBody: DeleteBoardResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'VF') customErrToast('잘못된 접근입니다.');
    if (code === 'NU') customErrToast('존재하지 않는 유저입니다.');
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'AF') customErrToast('인증에 실패했습니다.');
    if (code === 'NP') customErrToast('권환이 없습니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;
    navigate(BOARD_PATH());
  };

  const onMoreButtonClickHandler = () => setShowMore((p) => !p);
  const onNicknameClickHandler = () => {
    if (!board) return;
    navigate(USER_PATH(board.writerEmail));
  };
  const onUpdateButtonClickHandler = () => {
    if (!board || !loginUser) return;
    if (loginUser.email !== board.writerEmail) return;
    navigate(BOARD_PATH() + '/' + BOARD_UPDATE_PATH(board.boardNumber));
  };
  const onDeleteButtonClickHandler = () => {
    if (!board || !loginUser || !cookies.accessToken) return;
    if (loginUser.email !== board.writerEmail) return;
    deleteBoardRequest(String(board.boardNumber), cookies.accessToken).then(deleteBoardResponse);
  };

  // effect: boardNumber 변경 시 게시글 조회만 수행 (조회수 증가는 부모에서 1회 보장)
  useEffect(() => {
    if (!boardNumber) return;
    getBoardRequest(boardNumber).then(getBoardResponse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardNumber]);

  if (!board) return <></>;
  return (
    <div id="board-detail-top">
      <div className="board-detail-top-header">
        <div className="board-detail-title">{board.title}</div>
        <div className="board-detail-top-sub-box">
          <div className="board-detail-write-info-box">
            <div
              className="board-detail-writer-profile-image"
              style={{ backgroundImage: `url(${board.writerProfileImage ? board.writerProfileImage : defaultProfileImage})` }}
            ></div>
            <div className="board-detail-writer-nickname" onClick={onNicknameClickHandler}>
              {board.writerNickname}
            </div>
            <div className="board-detail-info-divider">{'|'}</div>
            <div className="board-detail-write-date">{getWriteDatetimeFormat()}</div>
          </div>
          {isWriter && (
            <div className="icon-button" onClick={onMoreButtonClickHandler}>
              <div className="icon more-icon"></div>
            </div>
          )}
          {showMore && (
            <div className="board-detail-more-box">
              <div className="board-detail-update-button" onClick={onUpdateButtonClickHandler}>
                {'수정'}
              </div>
              <div className="divider"></div>
              <div className="board-detail-delete-button" onClick={onDeleteButtonClickHandler}>
                {'삭제'}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="divider"></div>
      <div className="board-detail-top-main">
        <div className="board-detail-main-text">{board.content}</div>
        {board.boardImageList.map((image) => (
          <img key={image} className="board-detail-main-image" src={image} />
        ))}
      </div>
    </div>
  );
});

// ============================================================
// BoardDetailBottom (memoized, independent component)
// ============================================================
interface BoardDetailBottomProps {
  boardNumber: string;
  viewCount: number;
}

const BoardDetailBottom = memo(function BoardDetailBottom({ boardNumber, viewCount }: BoardDetailBottomProps) {
  const { loginUser } = useLoginUserStore();
  const [cookies] = useCookies();

  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const [favoriteList, setFavoriteList] = useState<FavoriteListItem[]>([]);
  const { currentPage, setCurrentPage, currentSection, setCurrentSection, viewList, viewPageList, totalSection, setTotalList } =
    usePagination<CommentListItem>(3);

  const [isFavorite, setFavorite] = useState<boolean>(false);
  const [showFavorite, setShowFavorite] = useState<boolean>(false);
  const [showComment, setShowComment] = useState<boolean>(false);
  const [totalCommentCount, setTotalCommentCount] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [animate, setAnimate] = useState(false);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [heartActive, setHeartActive] = useState(false);
  const [floatingTilt, setFloatingTilt] = useState<'tilt-left' | 'tilt-right'>('tilt-left');  
  
  // 댓글 삭제
  const handleDeleteComment = (commentNumber: number) => {
    if (!boardNumber) {
      customErrToast('게시물 번호가 유효하지 않습니다.');
      return;
    }
    if (!cookies.accessToken) {
      customErrToast('로그인이 필요합니다.');
      return;
    }
    const isConfirm = window.confirm('댓글을 정말 삭제하시겠습니까?');
    if (!isConfirm) return;
    deleteCommentRequest(commentNumber, cookies.accessToken).then(deleteCommentResponseCallback);
  };

  const deleteCommentResponseCallback = (responseBody: ResponseDto | null) => {
    if (!responseBody) {
      customErrToast('네트워크 응답이 없거나 요청에 실패했습니다.');
      return;
    }
    const { code } = responseBody;
    if (code === 'VF') customErrToast('잘못된 접근입니다.');
    else if (code === 'NU') customErrToast('존재하지 않는 유저입니다.');
    else if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    else if (code === 'NC') customErrToast('존재하지 않는 댓글입니다.');
    else if (code === 'AF') customErrToast('인증에 실패했습니다.');
    else if (code === 'NP') customErrToast('권한이 없습니다.');
    else if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    else if (code === 'SU') {
      customErrToast('댓글이 삭제되었습니다.');
      getCommentListRequest(boardNumber).then(getCommentListResponse);
    } else {
      customErrToast('알 수 없는 오류가 발생했습니다: ' + code);
    }
  };

  // 좋아요 리스트 응답 처리
  const getFavoriteListResponse = (responseBody: GetFavoriteListResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;

    const { favoriteList } = responseBody as GetFavoriteListResponseDto;
    setFavoriteList(favoriteList);
    if (!loginUser) {
      setFavorite(false);
      return;
    }
    
    const isFav = favoriteList.findIndex((favorite) => favorite.email === loginUser.email) !== -1;
    setFavorite(isFav);
    setShowFavorite(isFav);
  };

  // 댓글 리스트 응답 처리
  const getCommentListResponse = (responseBody: GetCommentListResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;

    const { commentList } = responseBody as GetCommentListResponseDto;
    setTotalList(commentList);
    setTotalCommentCount(commentList.length);
    if (commentList.length > 0) setShowComment(true);
  };

  // 좋아요 토글 응답 처리
  const putFavoriteResponse = (responseBody: PutFavoriteResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'VF') customErrToast('잘못된 접근입니다.');
    if (code === 'NU') customErrToast('존재하지 않는 유저입니다.');
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'AF') customErrToast('인증에 실패했습니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;
    getFavoriteListRequest(boardNumber).then(getFavoriteListResponse);
  };

  // 댓글 작성 응답 처리
  const postCommentResponse = (responseBody: PostCommentResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'VF') customErrToast('잘못된 접근입니다.');
    if (code === 'NU') customErrToast('존재하지 않는 유저입니다.');
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'AF') customErrToast('인증에 실패했습니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
    if (code !== 'SU') return;
    getCommentListRequest(boardNumber).then(getCommentListResponse);
  };

  // // 좋아요 클릭
  // const onFavoriteClickHandler = () => {
  //   if (!loginUser || !cookies.accessToken) return;

  //   setAnimate(true);
  //   setShowFloatingHeart(true);
  //   setTimeout(() => setAnimate(false), 300);
  //   setTimeout(() => setShowFloatingHeart(false), 1500);

  //   if (heartActive) return;
  //   setHeartActive(true);
  //   setTimeout(() => setHeartActive(false), 600);

  //   putFavoriteRequest(boardNumber, cookies.accessToken).then(putFavoriteResponse);
  // };

  const onFavoriteClickHandler = () => {
    if (!loginUser || !cookies.accessToken) return;

    const prevFavorite = isFavorite;
    const prevList = favoriteList;

    const newFavorite = !isFavorite;
    setFavorite(newFavorite);

      // 좋아요 수 즉시 변화
    setFavoriteList((prev) =>
      newFavorite
        ? [
            ...prev,
            {
              email: loginUser.email,
              nickname: loginUser.nickname,
              profileImage: loginUser.profileImage ?? null,
            },
          ]
        : prev.filter((item) => item.email !== loginUser.email)
    );


    if (newFavorite) {
      setAnimate(true);
      setShowFloatingHeart(true);

      const tilt = Math.random() > 0.5 ? "tilt-left" : "tilt-right";
      setFloatingTilt(tilt);

      setTimeout(() => setAnimate(false), 300);
      setTimeout(() => setShowFloatingHeart(false), 1500);

      if (!heartActive) {
        setHeartActive(true);
        setTimeout(() => setHeartActive(false), 600);
      }
    }

    putFavoriteRequest(boardNumber, cookies.accessToken)
      .then((response) => {
        if (!response || response.code !== "SU") {
          // ❌ 실패 → 롤백
          setFavorite(prevFavorite);
          setFavoriteList(prevList);
          customErrToast("좋아요 처리 실패");
        }
      })
      .catch(() => {
        // ❌ 에러 → 롤백
        setFavorite(prevFavorite);
        setFavoriteList(prevList);
        customErrToast("서버 오류");
      }
    );
  };


  const onShowFavoriteClickHandler = () => setShowFavorite((p) => !p);
  const onShowCommentClickHandler = () => setShowComment((p) => !p);

  const onCommentSubmitButtonClickHandler = () => {
    if (!comment || !loginUser || !cookies.accessToken) return;
    const requestBody: PostCommentRequestDto = { content: comment };
    postCommentRequest(boardNumber, requestBody, cookies.accessToken).then(postCommentResponse);
    setComment('');
    if (commentRef.current) commentRef.current.style.height = 'auto';
  };

  const onCommentChangeHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setComment(value);
    if (!commentRef.current) return;
    commentRef.current.style.height = 'auto';
    commentRef.current.style.height = `${commentRef.current.scrollHeight}px`;
  };

  // 좋아요/댓글 데이터 로드 (boardNumber 바뀔 때마다)
  useEffect(() => {
    if (!boardNumber) return;
    getFavoriteListRequest(boardNumber).then(getFavoriteListResponse);
    getCommentListRequest(boardNumber).then(getCommentListResponse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardNumber]);

  return (
    <div id="board-detail-bottom">
      <div className="board-detail-bottom-button-box">
        {/* 좋아요 */}
        <div className="board-detail-bottom-button-group">
          <div className="icon-button icon-relative" onClick={onFavoriteClickHandler}>
            {isFavorite ? (
              <>
                <div className={`icon favorite-fill-icon ${animate ? 'pop' : ''}`} onClick={onShowFavoriteClickHandler}></div>
                {showFloatingHeart && (
                  <div className={`floating-heart ${floatingTilt}`}>
                    <img src={floatingHeartImg} className="floating-heart-img" />
                  </div>
                )}
              </>
            ) : (
              <div className={`icon favorite-light-icon ${animate ? 'pop' : ''}`} onClick={onShowFavoriteClickHandler}></div>
            )}
          </div>
          <div className="board-detail-bottom-button-text">{'좋아요'}</div>
          <RollingNumber value={favoriteList.length} type="slide" className="board-detail-bottom-button-rolling" />
          <div className="icon-button" onClick={onShowFavoriteClickHandler}>
            {showFavorite ? <div className="icon up-light-icon"></div> : <div className="icon down-light-icon"></div>}
          </div>
        </div>

        {/* 댓글 */}
        <div className="board-detail-bottom-button-group">
          <div className="icon-button" onClick={onShowCommentClickHandler}>
            <div className="icon comment-fill-icon"></div>
          </div>
          <div className="board-detail-bottom-button-text">{'댓글'}</div>
          <RollingNumber value={totalCommentCount} type="slide" className="board-detail-bottom-button-rolling" />
          <div className="icon-button" onClick={onShowCommentClickHandler}>
            {showComment ? <div className="icon up-light-icon"></div> : <div className="icon down-light-icon"></div>}
          </div>
        </div>

        {/* 조회수 */}
        <div className="board-detail-bottom-button-group">
          <div className="board-detail-bottom-button-text">{'조회수'}</div>
          <InitRollingNumber initVal={Math.max(0, viewCount - 1)} value={viewCount} type="slide" speed={400} delay={500} className="board-detail-bottom-button-rolling" />
        </div>
      </div>

      {/* 좋아요 목록 */}
      {showFavorite && (
        <div className="board-detail-bottom-favorite-box">
          <div className="board-detail-bottom-favorite-container">
            <div className="board-detail-bottom-favorite-title">
              {'좋아요 '}<span className="emphasis">{favoriteList.length}</span>
            </div>
            <div className="board-detail-bottom-favorite-contents">
              {favoriteList.map((item) => (
                <FavoriteItem key={item.email} favoriteListItem={item} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 댓글 전체 박스 */}
      {showComment && (
        <div className="board-detail-bottom-comment-box">
          <div className="board-detail-bottom-comment-container">
            <div className="board-detail-bottom-comment-title">
              {'댓글 '}<span className="emphasis">{totalCommentCount}</span>
            </div>
            <div className="board-detail-bottom-comment-list-container">
              {viewList.map((commentItemData) => (
                <CommentItem key={commentItemData.commentNumber} commentListItem={commentItemData} onDeleteComment={handleDeleteComment} />
              ))}
            </div>
          </div>
          <div className="divider"></div>
          <div className="board-detail-bottom-comment-pagination-box">
            <Pagination
              currentPage={currentPage}
              currentSection={currentSection}
              setCurrentPage={setCurrentPage}
              setCurrentSection={setCurrentSection}
              viewPageList={viewPageList}
              totalSection={totalSection}
            />
          </div>
          {loginUser !== null && (
            <div className="board-detail-bottom-comment-input-box">
              <div className="board-detail-bottom-comment-input-container">
                <textarea
                  ref={commentRef}
                  className="board-detail-bottom-comment-textarea"
                  placeholder="댓글을 작성해주세요."
                  value={comment}
                  onChange={onCommentChangeHandler}
                />
                <div className="board-detail-bottom-comment-button-box">
                  <div className={comment === '' ? 'disable-button' : 'black-button'} onClick={onCommentSubmitButtonClickHandler}>
                    {'댓글달기'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================
// BoardDetail (parent)
//  - 조회수 증가를 게시물당 1회만 보장 (StrictMode 2회 실행 대응)
//  - 초기 렌더 타이머/플래그 제거
//  - 최초 진입 시 표기가 1 낮아지는 경우를 낙관적 +1로 보정
// ============================================================
export default function BoardDetail() {
  const { boardNumber: rawBoardNumber } = useParams();
  const boardNumber = useMemo(() => (rawBoardNumber ? String(rawBoardNumber) : ''), [rawBoardNumber]);
  const { loginUser } = useLoginUserStore();
  const [cookies] = useCookies();

  const [viewCount, setViewCount] = useState<number>(0);

  const lastIncreasedFor = useRef<string | null>(null);
  const [increasedMarker, setIncreasedMarker] = useState<string>(''); // ✅ 상태로도 보관하여 child에 즉시 반영

  const increaseViewCountResponse = (responseBody: IncreaseViewCountResponseDto | ResponseDto | null) => {
    if (!responseBody) return;
    const { code } = responseBody as ResponseDto;
    if (code === 'NB') customErrToast('존재하지 않는 게시물입니다.');
    if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
  };

  // 게시물 번호 변화 시 딱 1회만 조회수 증가
  useEffect(() => {
    if (!boardNumber) return;
    if (lastIncreasedFor.current === boardNumber) return;
    lastIncreasedFor.current = boardNumber;
    setIncreasedMarker(boardNumber); // ✅ 자식이 즉시 낙관적 업데이트를 하도록 신호
    increaseViewCountRequest(boardNumber).then(increaseViewCountResponse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardNumber]);

  if (!boardNumber) {
    return (
      <div id="board-datail-wrapper">
        <div className="board-datail-container">잘못된 접근입니다.</div>
      </div>
    );
  }

  return (
    <div id="board-datail-wrapper">
      <div className="board-datail-container">
        <BoardDetailTop
          boardNumber={boardNumber}
          setViewCount={setViewCount}
          increasedOnce={increasedMarker === boardNumber}
        />
        <BoardDetailBottom boardNumber={boardNumber} viewCount={viewCount} />
      </div>
    </div>
  );
}
