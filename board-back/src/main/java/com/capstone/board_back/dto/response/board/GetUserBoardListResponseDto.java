// package com.capstone.board_back.dto.response.board;

// import java.util.ArrayList;
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
// public class GetUserBoardListResponseDto extends ResponseDto{
//     private List<BoardListItem> userBoardList;

//     private GetUserBoardListResponseDto(List<BoardListViewEntity> boardListViewEntities) {
//         super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
//         this.userBoardList = BoardListItem.getList(boardListViewEntities);
//     }

//     public static ResponseEntity<GetUserBoardListResponseDto> success(List<BoardListViewEntity> boardListViewEntities) {
//         GetUserBoardListResponseDto result = new GetUserBoardListResponseDto(boardListViewEntities);
//         return ResponseEntity.status(HttpStatus.OK).body(result);
//     }

//     public static ResponseEntity<ResponseDto> noExistUser() {
//         ResponseDto result = new ResponseDto(ResponseCode.NOT_EXIST_USER, ResponseMessage.NOT_EXIST_USER);
//         return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
//     }
// }
package com.capstone.board_back.dto.response.board;

// import java.util.ArrayList; // ArrayList는 직접 사용하지 않으므로 삭제해도 됩니다.
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
public class GetUserBoardListResponseDto extends ResponseDto {

    // private List<BoardListItem> userBoardList; // ✨ 기존 필드 타입
    private List<BoardListItemResponseDto> userBoardList;   // ✨ 새로운 DTO 타입으로 변경

    // private GetUserBoardListResponseDto(List<BoardListViewEntity> boardListViewEntities) { // ✨ 기존 생성자
    private GetUserBoardListResponseDto(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        // this.userBoardList = BoardListItem.getList(boardListViewEntities); // ✨ 기존 변환 로직 삭제
        this.userBoardList = boardListItemResponseDtos; // ✨ 직접 할당
    }

    // public static ResponseEntity<GetUserBoardListResponseDto> success(List<BoardListViewEntity> boardListViewEntities) { // ✨ 기존 success 메소드
    public static ResponseEntity<GetUserBoardListResponseDto> success(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        GetUserBoardListResponseDto result = new GetUserBoardListResponseDto(boardListItemResponseDtos);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    public static ResponseEntity<ResponseDto> notExistUser() {
        ResponseDto result = new ResponseDto(ResponseCode.NOT_EXISTED_USER, ResponseMessage.NOT_EXISTED_USER);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }
}