package com.capstone.board_back.service.implement;

import com.capstone.board_back.common.util.BadWordFilter;
import com.capstone.board_back.common.util.BadWordFilterProvider;
import com.capstone.board_back.dto.request.board.PatchBoardRequestDto;
import com.capstone.board_back.dto.request.board.PostBoardRequestDto;
import com.capstone.board_back.dto.request.board.PostCommentRequestDto;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.board.*;
import com.capstone.board_back.entity.*;
import com.capstone.board_back.repository.*;
import com.capstone.board_back.repository.resultSet.*;
import com.capstone.board_back.service.BoardService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardServiceImplement implements BoardService{

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final ImageRepository imageRepository;
    private final CommentRepository commentRepository;
    private final FavoriteRepository favoriteRepository;
    private final BoardListViewRepository boardListViewRepository;
    private final SearchLogRepository searchLogRepository;
    private final BadWordFilterProvider badWordFilterProvider;

    @Override
    public ResponseEntity<? super GetBoardResponseDto> getBoard(Integer boardNumber) {
        GetBoardResultSet resultSet = null;
        List<ImageEntity> imageEntities = new ArrayList<>();

        try {
            resultSet = boardRepository.getBoard(boardNumber);
            if(resultSet == null) return GetBoardResponseDto.notExistBoard();

            imageEntities = imageRepository.findByBoardNumber(boardNumber);

            // ✔ 최신 필터 불러오기
            BadWordFilter filter = badWordFilterProvider.getFilter();

            // ▼ ▼ ▼ 욕설 마스킹 핵심 부분 ▼ ▼ ▼
            String maskedTitle = filter.mask(resultSet.getTitle());
            String maskedContent = filter.mask(resultSet.getContent());
            String maskedNickname = filter.mask(resultSet.getWriterNickname());

            GetBoardMaskedResult maskedResult =
                    new GetBoardMaskedResult(resultSet, maskedTitle, maskedContent, maskedNickname);

            return GetBoardResponseDto.success(maskedResult, imageEntities);

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super GetFavoriteListResponseDto> getFavoriteList(Integer boardNumber) {

        List<GetFavoriteListResultSet> resultSets = new ArrayList<>();
        try {
            boolean existedBoard = boardRepository.existsByBoardNumber(boardNumber);
            if(!existedBoard) return GetFavoriteListResponseDto.notExistBoard();

            resultSets = favoriteRepository.getFavoriteList(boardNumber);

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return GetFavoriteListResponseDto.success(resultSets, badWordFilterProvider);
    }

    @Override
    public ResponseEntity<? super GetCommentListResponseDto> getCommentList(Integer boardNumber) {

        List<GetCommentListResultSet> resultSets = new ArrayList<>();

        try {

            boolean existedBoard = boardRepository.existsByBoardNumber(boardNumber);
            if(!existedBoard) return GetCommentListResponseDto.notExistBoard();

            resultSets = commentRepository.getCommentList(boardNumber);

            BadWordFilter filter = badWordFilterProvider.getFilter();

            // ★ 댓글 마스킹 처리
            List<GetCommentListResultSet> maskedList = new ArrayList<>();

            for (GetCommentListResultSet item : resultSets) {
                String maskedContent  = filter.mask(item.getContent());
                String maskedNickname = filter.mask(item.getNickname());

                maskedList.add(new GetCommentMaskedResult(item, maskedContent, maskedNickname));
            }

            return GetCommentListResponseDto.success(maskedList);

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    // @Override
    // public ResponseEntity<? super GetLatestBoardListResponseDto> getLatestBoardList() {

    //     List<BoardListViewEntity> boardListViewEntities = new ArrayList<>();

    //     try {
    //         boardListViewEntities = boardListViewRepository.findByOrderByWriteDatetimeDesc();
    //     } catch (Exception exception) {
    //         exception.printStackTrace();
    //         return ResponseDto.databaseError();
    //     }
    //     return GetLatestBoardListResponseDto.success(boardListViewEntities);
    // }

    @Override
    public ResponseEntity<? super GetLatestBoardListResponseDto> getLatestBoardList() {

        List<BoardListItemResponseDto> boardListItemResponseDtos = new ArrayList<>();

        try {
            // 📌 전체 게시글 조회
            List<BoardListViewEntity> boardListViewEntities =
                    boardListViewRepository.findByOrderByWriteDatetimeDesc();

            // 📌 BadWordFilter 가져오기
            BadWordFilter filter = badWordFilterProvider.getFilter();

            // 📌 각 게시글 마스킹 + DTO 생성
            for (BoardListViewEntity boardListViewEntity : boardListViewEntities) {

                int boardNumber = boardListViewEntity.getBoardNumber();
                long imageCount = imageRepository.countByBoardNumber(boardNumber);

                // 🔥 마스킹
                String maskedTitle = filter.mask(boardListViewEntity.getTitle());
                String maskedContent = filter.mask(boardListViewEntity.getContent());
                String maskedNickname = filter.mask(boardListViewEntity.getWriterNickname());

                // 🔥 최종 DTO 생성 (마스킹된 값 사용)
                BoardListItemResponseDto dto =
                        new BoardListItemResponseDto(
                                boardListViewEntity,
                                (int) imageCount,
                                maskedTitle,
                                maskedContent,
                                maskedNickname
                        );

                boardListItemResponseDtos.add(dto);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return GetLatestBoardListResponseDto.success(boardListItemResponseDtos);
    }

    // @Override
    // public ResponseEntity<? super GetSearchBoardListResponseDto> getSearchBoardList(String searchWord,
    //         String preSearchWord) {

    //     List<BoardListViewEntity> boardListViewEntities = new ArrayList<>();

    //     try {

    //         boardListViewEntities = boardListViewRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByWriteDatetimeDesc(searchWord, searchWord);

    //         SearchLogEntity searchLogEntity = new SearchLogEntity(searchWord, preSearchWord, false);
    //         searchLogRepository.save(searchLogEntity);

    //         boolean relation = preSearchWord != null;
    //         if(relation) {
    //             searchLogEntity = new SearchLogEntity(preSearchWord, searchWord, true);
    //             searchLogRepository.save(searchLogEntity);
    //         }

    //     } catch (Exception exception) {
    //         exception.printStackTrace();
    //         return ResponseDto.databaseError();
    //     }
    //     return GetSearchBoardListResponseDto.success(boardListViewEntities);
    // }
    @Override
    public ResponseEntity<? super GetSearchBoardListResponseDto> getSearchBoardList(
            String searchWord,
            String preSearchWord
    ) {

        List<BoardListItemResponseDto> boardListItemResponseDtos = new ArrayList<>();

        try {
            // 게시글 검색
            List<BoardListViewEntity> boardListViewEntities =
                    boardListViewRepository
                            .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByWriteDatetimeDesc(
                                    searchWord, searchWord
                            );

            // 🔥 필터 가져오기
            BadWordFilter filter = badWordFilterProvider.getFilter();

            // DTO 변환 + 마스킹
            for (BoardListViewEntity boardListViewEntity : boardListViewEntities) {

                int boardNumber = boardListViewEntity.getBoardNumber();
                long imageCount = imageRepository.countByBoardNumber(boardNumber);

                String maskedTitle = filter.mask(boardListViewEntity.getTitle());
                String maskedContent = filter.mask(boardListViewEntity.getContent());
                String maskedNickname = filter.mask(boardListViewEntity.getWriterNickname());

                BoardListItemResponseDto dto =
                        new BoardListItemResponseDto(
                                boardListViewEntity,
                                (int) imageCount,
                                maskedTitle,
                                maskedContent,
                                maskedNickname
                        );

                boardListItemResponseDtos.add(dto);
            }

            // 검색 로그
            SearchLogEntity searchLogEntity = new SearchLogEntity(searchWord, preSearchWord, false);
            searchLogRepository.save(searchLogEntity);

            if (preSearchWord != null) {
                searchLogEntity = new SearchLogEntity(preSearchWord, searchWord, true);
                searchLogRepository.save(searchLogEntity);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return GetSearchBoardListResponseDto.success(boardListItemResponseDtos);
    }


    // @Override
    // public ResponseEntity<? super GetUserBoardListResponseDto> getUserBoardList(String email) {

    //     List<BoardListViewEntity> boardListViewEntities = new ArrayList<>();
    //     try {

    //         boolean existedUser = userRepository.existsByEmail(email);
    //         if(!existedUser) return GetUserBoardListResponseDto.notExistUser();

    //         boardListViewEntities = boardListViewRepository.findByWriterEmailOrderByWriteDatetimeDesc(email);

    //     } catch (Exception exception) {
    //         exception.printStackTrace();
    //         return ResponseDto.databaseError();
    //     }
    //     return GetUserBoardListResponseDto.success(boardListViewEntities);
    // }
    @Override
    public ResponseEntity<? super GetUserBoardListResponseDto> getUserBoardList(String email) {

        List<BoardListItemResponseDto> boardListItemResponseDtos = new ArrayList<>();

        try {

            boolean existedUser = userRepository.existsByEmail(email);
            if (!existedUser) return GetUserBoardListResponseDto.notExistUser();

            List<BoardListViewEntity> boardListViewEntities =
                    boardListViewRepository.findByWriterEmailOrderByWriteDatetimeDesc(email);

            // 🔥 필터 가져오기
            BadWordFilter filter = badWordFilterProvider.getFilter();

            for (BoardListViewEntity boardListViewEntity : boardListViewEntities) {

                int boardNumber = boardListViewEntity.getBoardNumber();
                long imageCount = imageRepository.countByBoardNumber(boardNumber);

                String maskedTitle = filter.mask(boardListViewEntity.getTitle());
                String maskedContent = filter.mask(boardListViewEntity.getContent());
                String maskedNickname = filter.mask(boardListViewEntity.getWriterNickname());

                BoardListItemResponseDto dto =
                        new BoardListItemResponseDto(
                                boardListViewEntity,
                                (int) imageCount,
                                maskedTitle,
                                maskedContent,
                                maskedNickname
                        );

                boardListItemResponseDtos.add(dto);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return GetUserBoardListResponseDto.success(boardListItemResponseDtos);
    }


    // @Override
    // public ResponseEntity<? super GetTop3BoardListResponseDto> getTop3BoardList() {

    //     List<BoardListViewEntity> boardListViewEntities = new ArrayList<>();

    //     try {
    //         Date beforeWeek = Date.from(Instant.now().minus(7, ChronoUnit.DAYS));
    //         SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    //         String sevenDaysAgo = simpleDateFormat.format(beforeWeek);
    //         boardListViewEntities = boardListViewRepository.findTop3ByWriteDatetimeGreaterThanOrderByFavoriteCountDescCommentCountDescViewCountDescWriteDatetimeDesc(sevenDaysAgo);
    //     } catch (Exception exception) {
    //         exception.printStackTrace();
    //         return ResponseDto.databaseError();
    //     }
    //     return GetTop3BoardListResponseDto.success(boardListViewEntities);
    // }
    @Override
    public ResponseEntity<? super GetTop3BoardListResponseDto> getTop3BoardList() {

        List<BoardListItemResponseDto> boardListItemResponseDtos = new ArrayList<>();

        try {
            Date beforeWeek = Date.from(Instant.now().minus(7, ChronoUnit.DAYS));
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String sevenDaysAgo = sdf.format(beforeWeek);

            List<BoardListViewEntity> boardListViewEntities =
                    boardListViewRepository
                            .findTop10ByWriteDatetimeGreaterThanOrderByFavoriteCountDescCommentCountDescViewCountDescWriteDatetimeDesc(
                                    sevenDaysAgo
                            );

            // 🔥 필터 가져오기
            BadWordFilter filter = badWordFilterProvider.getFilter();

            for (BoardListViewEntity boardListViewEntity : boardListViewEntities) {

                int boardNumber = boardListViewEntity.getBoardNumber();
                long imageCount = imageRepository.countByBoardNumber(boardNumber);

                String maskedTitle = filter.mask(boardListViewEntity.getTitle());
                String maskedContent = filter.mask(boardListViewEntity.getContent());
                String maskedNickname = filter.mask(boardListViewEntity.getWriterNickname());

                BoardListItemResponseDto dto =
                        new BoardListItemResponseDto(
                                boardListViewEntity,
                                (int) imageCount,
                                maskedTitle,
                                maskedContent,
                                maskedNickname
                        );

                boardListItemResponseDtos.add(dto);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return GetTop3BoardListResponseDto.success(boardListItemResponseDtos);
    }


    @Override
    public ResponseEntity<? super PostBoardResponseDto> postBoard(PostBoardRequestDto dto, String email) {
        try {

            boolean existedEmail = userRepository.existsByEmail(email);
            if(!existedEmail) return PostBoardResponseDto.notExistUser();

            BoardEntity boardEntity = new BoardEntity(dto, email);
            boardRepository.save(boardEntity);

            int boardNumber = boardEntity.getBoardNumber();

            List<String> boardImageList = dto.getBoardImageList();
            List<ImageEntity> imageEntities = new ArrayList<>();

            for(String image: boardImageList) {
                ImageEntity imageEntity = new ImageEntity(boardNumber, image);
                imageEntities.add(imageEntity);
            }

            imageRepository.saveAll(imageEntities);




        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return PostBoardResponseDto.success();
    }

    @Override
    public ResponseEntity<? super PostCommentResponseDto> postComment(PostCommentRequestDto dto, Integer boardNumber, String email) {
        try {

            BoardEntity boardEntity = boardRepository.findByBoardNumber(boardNumber);
            if(boardEntity == null) return PostCommentResponseDto.notExistBoard();

            boolean existedUser = userRepository.existsByEmail(email);
            if(!existedUser) return PostBoardResponseDto.notExistUser();

            CommentEntity commentEntity = new CommentEntity(dto,boardNumber,email);
            commentRepository.save(commentEntity);

            boardEntity.increaseCommentCount();
            boardRepository.save(boardEntity);

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return PostCommentResponseDto.success();
    }

    @Override
    public ResponseEntity<? super PutFavoriteResponseDto> putFavorite(Integer boardNumber, String email) {
        try {

            boolean existedUser = userRepository.existsByEmail(email);
            if(!existedUser) return PutFavoriteResponseDto.notExistUser();

            BoardEntity boardEntity = boardRepository.findByBoardNumber(boardNumber);
            if(boardEntity == null) return PutFavoriteResponseDto.notExistBoard();

            FavoriteEntity favoriteEntity = favoriteRepository.findByBoardNumberAndUserEmail(boardNumber, email);
            if(favoriteEntity == null) {
                favoriteEntity = new FavoriteEntity(email, boardNumber);
                favoriteRepository.save(favoriteEntity);
                boardEntity.increaseFavoriteCount();
            }
            else {
                favoriteRepository.delete(favoriteEntity);
                boardEntity.decreaseFavoriteCount();
            }

            boardRepository.save(boardEntity);


        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return PutFavoriteResponseDto.success();
    }


    @Override
    public ResponseEntity<? super PatchBoardResponseDto> patchBoard(PatchBoardRequestDto dto, Integer boardNumber,
                                                                    String email) {
        try {
            BoardEntity boardEntity = boardRepository.findByBoardNumber(boardNumber);
            if(boardEntity == null) return PatchBoardResponseDto.notExistBoard();

            boolean existedUser = userRepository.existsByEmail(email);
            if(!existedUser) return PatchBoardResponseDto.notExistUser();

            String writerEmail = boardEntity.getWriterEmail();
            boolean isWriter = writerEmail.equals(email);
            if(!isWriter) return PatchBoardResponseDto.notPermission();

            boardEntity.patchBoard(dto);
            boardRepository.save(boardEntity);

            imageRepository.deleteByBoardNumber(boardNumber);
            List<String> boardImageList = dto.getBoardImageList();
            List<ImageEntity> imageEntities = new ArrayList<>();

            for(String image: boardImageList){
                ImageEntity imageEntity = new ImageEntity(boardNumber, image);
                imageEntities.add(imageEntity);
            }

            imageRepository.saveAll(imageEntities);

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return PatchBoardResponseDto.success();
    }

    @Override
    public ResponseEntity<? super IncreaseViewCountResponseDto> increaseViewCount(Integer boardNumber) {
        try {
            BoardEntity boardEntity = boardRepository.findByBoardNumber(boardNumber);
            if(boardEntity == null) return IncreaseViewCountResponseDto.notExistBoard();

            boardEntity.increaseViewCount();
            boardRepository.save(boardEntity);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return IncreaseViewCountResponseDto.success();
    }

    @Override
    public ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(Integer boardNumber, String email) {
        try {
            boolean existedUser = userRepository.existsByEmail(email);
            if(!existedUser) return DeleteBoardResponseDto.notExistUser();

            BoardEntity boardEntity = boardRepository.findByBoardNumber(boardNumber);
            if(boardEntity == null) return DeleteBoardResponseDto.notExistBoard();

            String writerEmail = boardEntity.getWriterEmail();
            boolean isWriter = writerEmail.equals(email);
            if(!isWriter) return DeleteBoardResponseDto.notPermission();

            imageRepository.deleteByBoardNumber(boardNumber);
            commentRepository.deleteByBoardNumber(boardNumber);
            favoriteRepository.deleteByBoardNumber(boardNumber);

            boardRepository.delete(boardEntity);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
        return DeleteBoardResponseDto.success();
    }

    // ✨ 댓글 삭제 로직 구현
    @Override
    @Transactional // 데이터 변경 작업이므로 트랜잭션 처리 권장
    public ResponseEntity<? super DeleteCommentResponseDto> deleteComment(Integer commentNumber, String email) {
        try {
            // 1. 댓글 작성자 확인을 위해 사용자 존재 여부 확인 (선택적이지만, email 유효성 검사)
            boolean existedUser = userRepository.existsByEmail(email);
            if (!existedUser) return DeleteCommentResponseDto.notExistUser(); // 또는 적절한 오류 응답

            // 2. 삭제할 댓글 조회
            CommentEntity commentEntity = commentRepository.findById(commentNumber).orElse(null);
            if (commentEntity == null) return DeleteCommentResponseDto.notExistComment(); // 또는 적절한 오류 응답

            // 3. 댓글 작성자와 요청한 사용자가 동일한지 확인 (권한 확인)
            String commentWriterEmail = commentEntity.getUserEmail();
            boolean isWriter = email.equals(commentWriterEmail);
            if (!isWriter) return DeleteCommentResponseDto.notPermission(); // 또는 적절한 오류 응답

            // 4. 댓글 삭제
            commentRepository.delete(commentEntity);

            // 5. 해당 게시물의 댓글 수 감소
            BoardEntity boardEntity = boardRepository.findByBoardNumber(commentEntity.getBoardNumber());
            // 게시물이 존재하고, 댓글 수가 0 이상일 때만 감소 (방어 코드)
            if (boardEntity != null && boardEntity.getCommentCount() > 0) {
                boardEntity.decreaseCommentCount(); // BoardEntity에 추가한 메소드 사용
                boardRepository.save(boardEntity);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError(); // 공통 데이터베이스 오류 사용
        }

        return DeleteCommentResponseDto.success(); // 성공 응답
    }
}