import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import './style.css'; // User.tsx에 대한 스타일 파일이 있다면 경로 확인
import defaultProfileImage from 'assets/image/default-profile-image.png';
import { useNavigate, useParams } from 'react-router-dom';
import { BoardListItem } from 'types/interface';
import BoardItem from 'components/BoardItem'; // BoardItem 컴포넌트 import 확인
import { BOARD_PATH, BOARD_WRITE_PATH, MAIN_PATH, USER_PATH } from 'constant';
import { useLoginUserStore } from 'stores';
import { fileUploadRequest, getUserBoardListRequest, getUserRequest, patchNicknameRequest, patchProfileImageRequest } from 'apis';
import { GetUserResponseDto, PatchNicknameResponseDto, PatchProfileImageResponseDto } from 'apis/response/user';
import { ResponseDto } from 'apis/response';
import { PatchNicknameRequestDto, PatchProfileImageRequestDto } from 'apis/request/user';
import { useCookies } from 'react-cookie';
import { customErrToast, usePagination } from 'hooks';
import { GetUserBoardListResponseDto } from 'apis/response/board';
import Pagination from 'components/Pagination';

export default function User() {
    const { userEmail } = useParams(); // URL 경로에서 현재 보고 있는 사용자의 email 추출
    const { loginUser } = useLoginUserStore(); // 현재 로그인한 사용자 정보
    const [cookies, setCookie] = useCookies();
    const navigate = useNavigate();

    // 현재 보고 있는 사용자 페이지의 프로필 정보 상태
    const [profileUserEmail, setProfileUserEmail] = useState<string>('');
    const [profileNickname, setProfileNickname] = useState<string>('');
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    
    const [isMypage, setMypage] = useState<boolean>(false);
    const [userNotFoundAlertShown, setUserNotFoundAlertShown] = useState<boolean>(false);
    const [isLoadingUserInfo, setIsLoadingUserInfo] = useState<boolean>(true); // 사용자 정보 로딩 상태

    const prevUserEmailRef = useRef<string | undefined>(undefined);
    // 사용자 정보 API 응답 처리 함수
    const handleGetUserResponse = (responseBody: GetUserResponseDto | ResponseDto | null) => {
        setIsLoadingUserInfo(false);
        if (!responseBody) {
            if (!userNotFoundAlertShown) {
                customErrToast('존재하지 않는 유저입니다.');
                setUserNotFoundAlertShown(true);
            }
            return;
        }
        const { code } = responseBody;
        if (code === 'NU') {
            if (!userNotFoundAlertShown) {
                customErrToast('존재하지 않는 유저입니다.');
                setUserNotFoundAlertShown(true);
            }
            return;
        }
        if (code === 'DBE') {
            if (!userNotFoundAlertShown) { customErrToast('데이터베이스 오류입니다.'); setUserNotFoundAlertShown(true); }
            return;
        }
        if (code !== 'SU') {
            if (!userNotFoundAlertShown) { customErrToast('알 수 없는 오류로 사용자 정보를 가져오지 못했습니다.'); setUserNotFoundAlertShown(true); }
            return;
        }

        const { email, nickname, profileImage } = responseBody as GetUserResponseDto;
        setProfileUserEmail(email);
        setProfileNickname(nickname);
        setProfileImageUrl(profileImage);
        setUserNotFoundAlertShown(false); // 성공 시 플래그 리셋
    };

    // userEmail (URL 파라미터) 변경 시 사용자 정보 가져오기 및 상태 초기화
    useEffect(() => {
        if (!userEmail) {
            navigate(MAIN_PATH());
            return;
        }
        // userEmail이 실제로 변경되었을 때만 프로필 정보 초기화 및 API 호출
        if (prevUserEmailRef.current !== userEmail) {
            setUserNotFoundAlertShown(false); 
            setProfileUserEmail(''); 
            setProfileNickname('');
            setProfileImageUrl(null);
            setIsLoadingUserInfo(true); // 로딩 시작
            
            getUserRequest(userEmail).then(handleGetUserResponse);
            prevUserEmailRef.current = userEmail; // 이전 userEmail 업데이트
        }
    }, [userEmail, navigate]);

    // loginUser 또는 조회된 profileUserEmail (즉, userEmail에 해당하는 실제 사용자 이메일) 변경 시 마이페이지 여부 업데이트
    useEffect(() => {
        if (!userEmail || !profileUserEmail) { // profileUserEmail이 아직 로드되지 않았으면 정확한 비교 불가
            setMypage(false); 
            return;
        }
        const myPageCheck = profileUserEmail === loginUser?.email;
        setMypage(myPageCheck);
    }, [profileUserEmail, loginUser, userEmail]);

    // userNotFoundAlertShown 상태가 true로 변경되면 메인 페이지로 이동
    useEffect(() => {
        if (userNotFoundAlertShown) {
            // 현재 경로가 MAIN_PATH가 아닐 때만 중복 네비게이션 방지
            if (window.location.pathname !== MAIN_PATH()) {
                 navigate(MAIN_PATH());
            }
        }
    }, [userNotFoundAlertShown, navigate]);

    //         component: 유저 화면 상단 컴포넌트           //
    const UserTop = () => {
        const imageInputRef = useRef<HTMLInputElement | null>(null);
        const [isNicknameChange, setNicknameChange] = useState<boolean>(false);
        const [changeNickname, setChangeNickname] = useState<string>('');

        // 프로필 정보 갱신 요청 함수 (부모의 API 호출 로직 사용)
        const refreshUserProfile = () => {
            if (userEmail) {
                setIsLoadingUserInfo(true); // 부모의 로딩 상태 변경
                getUserRequest(userEmail).then(handleGetUserResponse);
            }
        };

        const fileUploadResponse = (newUploadedProfileImage: string | null) => {
            if (!newUploadedProfileImage || !cookies.accessToken || !userEmail) return;
            const requestBody: PatchProfileImageRequestDto = { profileImage: newUploadedProfileImage };
            patchProfileImageRequest
            (requestBody, cookies.accessToken).then(patchProfileImageResponse);
        };
        
        const patchProfileImageResponse = (responseBody: PatchProfileImageResponseDto | ResponseDto | null) => {
            if (!responseBody) return;
            const { code } = responseBody;
            if (code === 'AF') customErrToast('인증에 실패했습니다.');
            else if (code === 'NU') {
                 if (!userNotFoundAlertShown) { customErrToast('존재하지 않는 유저입니다.'); setUserNotFoundAlertShown(true); }
            }
            else if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
            else if (code === 'SU') {
                refreshUserProfile(); // 성공 시 프로필 정보 갱신
            }
        };
        
        const patchNicknameResponse = (responseBody: PatchNicknameResponseDto | ResponseDto | null) => {
            if (!responseBody) return;
            const { code } = responseBody;
            if (code === 'VF') customErrToast('닉네임은 필수입니다.');
            else if (code === 'AF') customErrToast('인증에 실패했습니다.');
            else if (code === 'DN') customErrToast('중복된 닉네임입니다.');
            else if (code === 'NU') {
                if (!userNotFoundAlertShown) { customErrToast('존재하지 않는 유저입니다.'); setUserNotFoundAlertShown(true); }
            }
            else if (code === 'DBE') customErrToast('데이터베이스 오류입니다.');
            else if (code === 'SU') {
                refreshUserProfile(); // 성공 시 프로필 정보 갱신
                setNicknameChange(false);
            }
        };

        const onProfileBoxClickHandler = () => {
            if (!isMypage || !imageInputRef.current) return;
            imageInputRef.current.click();
        };
        const onNicknameEditButtonClickHandler = () => {
            if (!isNicknameChange) {
                setChangeNickname(profileNickname); 
                setNicknameChange(true);
                return;
            }
            if (!cookies.accessToken) return;
            const requestBody: PatchNicknameRequestDto = { nickname: changeNickname };
            patchNicknameRequest(requestBody, cookies.accessToken).then(patchNicknameResponse);
        };
        const onProfileImageChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
            if (!event.target.files || !event.target.files.length) return;
            const file = event.target.files[0];
            const data = new FormData();
            data.append('file', file);
            fileUploadRequest(data).then(fileUploadResponse);
        };
        const onNicknameChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            setChangeNickname(value);
        };

        // UserTop은 더 이상 자체적으로 userEmail 변경을 감지하여 API를 호출하지 않습니다.
        // 모든 프로필 정보는 부모 User 컴포넌트의 상태(profileUserEmail, profileNickname, profileImageUrl)를 사용합니다.

        if (isLoadingUserInfo && !profileUserEmail) { // 로딩 중이면서 아직 프로필 정보가 없을 때
            return <div id='user-top-wrapper'>사용자 정보를 불러오는 중입니다...</div>;
        }
        // 사용자를 찾을 수 없다고 플래그가 설정되었거나, URL의 userEmail은 있지만 profileUserEmail이 없는 경우 (오류 또는 아직 로드 안됨)
        // 이 부분은 부모 User 컴포넌트의 최상위 return에서 이미 null 처리하므로, 여기서는 profileUserEmail이 있을 때만 렌더링
        if (!profileUserEmail) return null;


        return (
            <div id='user-top-wrapper'>
                <div className='user-top-container'>
                    {isMypage ? (
                        <div className='user-top-my-profile-image-box' onClick={onProfileBoxClickHandler}>
                            {profileImageUrl ? (
                                <div className='user-top-profile-image' style={{ backgroundImage: `url(${profileImageUrl})` }}></div>
                            ) : (
                                <div className='icon-box-large'> <div className='icon image-box-white-icon'></div> </div>
                            )}
                            <input ref={imageInputRef} type="file" accept='image/*' style={{ display: 'none' }} onChange={onProfileImageChangeHandler} />
                        </div>
                    ) : (
                        <div className='user-top-profile-image-box' style={{ backgroundImage: `url(${profileImageUrl ? profileImageUrl : defaultProfileImage})` }}></div>
                    )}
                    <div className='user-top-info-box'>
                        <div className='user-top-info-nickname-box'>
                            {isMypage ? (
                                <>
                                    {isNicknameChange ? (
                                        <input className='user-top-info-nickname-input' type='text' size={(profileNickname?.length || 0) + 2} value={changeNickname} onChange={onNicknameChangeHandler} />
                                    ) : (
                                        <div className='user-top-info-nickname'>{profileNickname}</div>
                                    )}
                                    <div className='icon-button' onClick={onNicknameEditButtonClickHandler}>
                                        <div className='icon edit-icon'></div>
                                    </div>
                                </>
                            ) : (
                                <div className='user-top-info-nickname'>{profileNickname}</div>
                            )}
                        </div>
                        <div className='user-top-info-email'>{profileUserEmail}</div>
                    </div>
                </div>
            </div>
        );
    };

    const UserBottom = () => {
        const {
            currentPage, setCurrentPage, currentSection, setCurrentSection,
            viewList, viewPageList, totalSection, setTotalList
        } = usePagination<BoardListItem>(5);
        const [count, setCount] = useState<number>(0);

        const getUserBoardListResponse = (responseBody: GetUserBoardListResponseDto | ResponseDto | null) => {
            if (!responseBody) { setTotalList([]); setCount(0); return; }
            const { code } = responseBody;
            if (code === 'NU') { setTotalList([]); setCount(0); return; }
            if (code === 'DBE') { customErrToast('게시물 목록 오류'); setTotalList([]); setCount(0); return; }
            if (code !== 'SU') { setTotalList([]); setCount(0); return; }
            const { userBoardList } = responseBody as GetUserBoardListResponseDto;
            setTotalList(userBoardList);
            setCount(userBoardList.length);
        };
        
        const onSideCardClickHandler = () => {
            if (isMypage) navigate(BOARD_PATH() + '/' + BOARD_WRITE_PATH());
            else if (loginUser) navigate(USER_PATH(loginUser.email));
        };

        useEffect(() => {
            if (!userEmail || userNotFoundAlertShown || isLoadingUserInfo) { 
                setTotalList([]); 
                setCount(0);      
                return;
            }
            getUserBoardListRequest(userEmail).then(getUserBoardListResponse);
        }, [userEmail, userNotFoundAlertShown, isLoadingUserInfo]);

        // 사용자 정보 로딩 중이거나, 오류 발생 시 UserBottom도 내용 숨김
        if (isLoadingUserInfo || userNotFoundAlertShown || !userEmail) return null; 
        // 프로필 정보가 아직 로드되지 않았다면 (userEmail은 있지만 profileUserEmail은 아직 없을 때)
        if (!profileUserEmail) return null;


        return (
            <div id='user-bottom-wrapper'>
                <div className='user-bottom-container'>
                    <div className='user-bottom-title'>{isMypage ? '내 게시물' : `${profileNickname || userEmail}님의 게시물`} <span className='emphasis'>{count}</span></div>
                    <div className='user-bottom-contents-box'>
                        {count === 0 ? (
                            <div className='user-bottom-contents-nothing'>{'게시물이 없습니다.'}</div>
                        ) : (
                            <div className='user-bottom-contents'>
                                {viewList.map(boardListItem => <BoardItem key={boardListItem.boardNumber} boardListItem={boardListItem} />)}
                            </div>
                        )}
                        <div className='user-bottom-side-box'>
                            <div className='user-bottom-side-card' onClick={onSideCardClickHandler}>
                                <div className='user-bottom-side-container'>
                                    {isMypage ? (
                                        <>
                                            <div className='icon-box'> <div className='icon edit-icon'></div> </div>
                                            <div className='user-bottom-side-text'>{'글쓰기'}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className='user-bottom-side-text'>{'내 게시물로 가기'}</div>
                                            <div className='icon-box'> <div className='icon arrow-right-icon'></div> </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {count !== 0 && (
                        <div className='user-bottom-pagination-box'>
                            <Pagination
                                currentPage={currentPage} currentSection={currentSection}
                                setCurrentPage={setCurrentPage} setCurrentSection={setCurrentSection}
                                viewPageList={viewPageList} totalSection={totalSection}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // 최상위 User 컴포넌트 렌더링 조건
    // userEmail이 없는 경우 (잘못된 경로 접근 시) 첫번째 useEffect에서 navigate 처리
    // userNotFoundAlertShown이 true인 경우 두번째 useEffect에서 navigate 처리
    // isLoadingUserInfo가 true인 동안 UserTop, UserBottom에서 로딩 UI 또는 null 반환 가능
    if (isLoadingUserInfo && !userNotFoundAlertShown) {
        // 로딩 중임을 명시적으로 표시하고 싶다면 여기서 전체 로딩 UI를 반환할 수 있습니다.
        // 또는 UserTop/UserBottom에서 각각 로딩 상태를 처리하도록 둡니다.
        // 여기서는 UserTop/UserBottom에서 각자 로딩을 처리하도록 위임하고, 최상위에서는 null 반환은 최소화합니다.
    }
    
    // userEmail이 유효하지 않거나, 사용자를 찾을 수 없어 navigate될 예정이라면, 
    // UserTop, UserBottom이 null을 반환하거나 로딩 메시지를 표시하도록 위임
    // 만약 userEmail이 유효하지 않다면(예: params에서 못가져옴), 최상위 useEffect에서 이미 navigate(MAIN_PATH())를 호출했을 것
    if (!userEmail) return null; // useParams에서 userEmail이 없을 경우 (거의 발생 안함)

    return (
        <>
            <UserTop />
            <UserBottom />
        </>
    );
}