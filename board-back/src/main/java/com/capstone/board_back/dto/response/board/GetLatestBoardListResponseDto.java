// package com.capstone.board_back.dto.response.board;

// import java.util.List;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;

// import com.capstone.board_back.common.ResponseCode;
// import com.capstone.board_back.common.ResponseMessage;
// import com.capstone.board_back.dto.object.BoardListItem;
// import com.capstone.board_back.dto.response.ResponseDto;
// import com.capstone.board_back.entity.BoardListViewEntity;

// import lombok.Getter;

// @Getter
// public class GetLatestBoardListResponseDto extends ResponseDto{

//     private List<BoardListItem> latestList;

//     private GetLatestBoardListResponseDto(List<BoardListViewEntity> boardEntities) {
//         super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
//         this.latestList = BoardListItem.getList(boardEntities);
//     }

//     public static ResponseEntity<GetLatestBoardListResponseDto> success(List<BoardListViewEntity> boardEntities) {
//         GetLatestBoardListResponseDto result = new GetLatestBoardListResponseDto(boardEntities);
//         return ResponseEntity.status(HttpStatus.OK).body(result);
//     }
// }
package com.capstone.board_back.dto.response.board;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
// import com.capstone.board_back.dto.object.BoardListItem; // ✨ 기존 import 주석 처리 또는 삭제
import com.capstone.board_back.dto.response.board.BoardListItemResponseDto; // ✨ 새로운 DTO import
import com.capstone.board_back.dto.response.ResponseDto;
// import com.capstone.board_back.entity.BoardListViewEntity; // ✨ 이 DTO에서는 더 이상 직접 사용 안 함

import lombok.Getter;

@Getter
public class GetLatestBoardListResponseDto extends ResponseDto {

    // private List<BoardListItem> latestList; // ✨ 기존 필드 타입
    private List<BoardListItemResponseDto> latestList;   // ✨ 새로운 DTO 타입으로 변경

    // private GetLatestBoardListResponseDto(List<BoardListViewEntity> boardEntities) { // ✨ 기존 생성자
    private GetLatestBoardListResponseDto(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        // this.latestList = BoardListItem.getList(boardEntities); // ✨ 기존 변환 로직 삭제
        this.latestList = boardListItemResponseDtos; // ✨ 직접 할당
    }

    // public static ResponseEntity<GetLatestBoardListResponseDto> success(List<BoardListViewEntity> boardEntities) { // ✨ 기존 success 메소드
    public static ResponseEntity<GetLatestBoardListResponseDto> success(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        GetLatestBoardListResponseDto result = new GetLatestBoardListResponseDto(boardListItemResponseDtos);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }
}