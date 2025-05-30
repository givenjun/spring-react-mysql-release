import './style.css'
import { CommentListItem } from 'types/interface'
import defaultProfileImage from 'assets/image/default-profile-image.png'
import dayjs from 'dayjs'
import { useLoginUserStore } from 'stores';


interface Props {
    commentListItem: CommentListItem;
    // ✨ 삭제 처리를 위한 함수를 props로 받습니다 (BoardDetail 컴포넌트에서 전달)
    onDeleteComment: (commentNumber: number) => void;
}

//         component: Comment List Item 컴포넌트           //
export default function CommentItem({ commentListItem, onDeleteComment }: Props) { // ✨ onDeleteComment prop 추가

    //         properties:y           //
    // ✨ commentNumber와 userEmail을 props에서 가져옵니다.
    const { commentNumber, nickname, profileImage, writeDatetime, content, userEmail } = commentListItem;
    const { loginUser } = useLoginUserStore(); // ✨ 로그인 유저 정보 가져오기

    //         function: 작성일 경과시간 함수           //
    const getElapsedTime = () => {
        const now = dayjs() // 한국 시간 기준으로 보정 (필요시)
        const writeTime = dayjs(writeDatetime);

        const gap = now.diff(writeTime, 's');
        if (gap < 60) return `${gap}초 전`;
        if (gap < 3600) return `${Math.floor(gap / 60)}분 전`;
        if (gap < 86400) return `${Math.floor(gap / 3600)}시간 전`;
        return `${Math.floor(gap / 86400)}일 전`;
    };

    // ✨ 삭제 아이콘 클릭 이벤트 핸들러
    const handleDeleteIconClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation(); // 부모 요소로의 이벤트 전파 중단 (예: comment-list-item 전체 클릭 방지)
        if (!commentNumber) return;
        // 부모 컴포넌트(BoardDetail)로부터 받은 삭제 함수 호출
        onDeleteComment(commentNumber);
    };

    //         component: Comment List Item 컴포넌트 렌더링           //
    return (
        <div className='comment-list-item'>
            <div className='comment-list-item-top'>
                <div className='comment-list-item-profile-box'>
                    <div className='comment-list-item-profile-image' style={{ backgroundImage: `url(${profileImage ? profileImage : defaultProfileImage})` }}></div>
                </div>
                <div className='comment-list-item-nickname'>{nickname}</div>
                <div className='comment-list-item-divider'>{'\|'}</div>
                <div className='comment-list-item-time'>{getElapsedTime()}</div>

                {/* ✨ 로그인한 사용자와 댓글 작성자가 같을 경우에만 삭제 아이콘 표시 */}
                {loginUser && loginUser.email === userEmail && (
                     <div className='icon-button comment-item-delete-button'onClick={handleDeleteIconClick} title='댓글 삭제'>
                        <div className='icon close-icon'></div> {/* App.css에 정의된 스타일 사용 */}
                    </div>
                )}
            </div>
            <div className='comment-list-item-main'>
                <div className='comment-list-item-content'>
                    {content}
                </div>
            </div>
        </div>
    );
}