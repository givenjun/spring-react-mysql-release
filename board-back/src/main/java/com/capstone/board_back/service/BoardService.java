package com.capstone.board_back.service;

import com.capstone.board_back.dto.request.board.PatchBoardRequestDto;
import com.capstone.board_back.dto.request.board.PostBoardRequestDto;
import com.capstone.board_back.dto.request.board.PostCommentRequestDto;
import com.capstone.board_back.dto.response.board.*;
import org.springframework.http.ResponseEntity;

public interface BoardService {
    //GET
    ResponseEntity<? super GetBoardResponseDto> getBoard(Integer boardNumber);
    ResponseEntity<? super GetFavoriteListResponseDto> getFavoriteList(Integer boardNumber);
    ResponseEntity<? super GetCommentListResponseDto> getCommentList(Integer boardNumber);
    ResponseEntity<? super GetLatestBoardListResponseDto> getLatestBoardList();
    ResponseEntity<? super GetTop3BoardListResponseDto> getTop3BoardList();
    ResponseEntity<? super GetSearchBoardListResponseDto> getSearchBoardList(String searchWord, String preSearchWord);
    ResponseEntity<? super GetUserBoardListResponseDto> getUserBoardList(String email);
    //POST
    ResponseEntity<? super PostBoardResponseDto> postBoard(PostBoardRequestDto dto, String email);
    ResponseEntity<? super PostCommentResponseDto> postComment(PostCommentRequestDto dto, Integer boardNumber, String email);
    //PUT
    ResponseEntity<? super PutFavoriteResponseDto> putFavorite(Integer boardNumber, String email);
    //PATCH
    ResponseEntity<? super PatchBoardResponseDto> patchBoard(PatchBoardRequestDto dto, Integer boardNumber, String email);
    //OTHER
    ResponseEntity<? super IncreaseViewCountResponseDto> increaseViewCount(Integer boardNumber);
    //DELETE
    ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(Integer boardNumber, String email);
    // ✨ 댓글 삭제 서비스 메소드 선언 추가
    ResponseEntity<? super DeleteCommentResponseDto> deleteComment(Integer commentNumber, String email);

}
