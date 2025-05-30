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
// public class GetSearchBoardListResponseDto extends ResponseDto{

//     private List<BoardListItem> searchList;

//     private GetSearchBoardListResponseDto(List<BoardListViewEntity> boardListViewEntities) {
//         super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
//         this.searchList = BoardListItem.getList(boardListViewEntities);
//     }

//     public static ResponseEntity<GetSearchBoardListResponseDto> success(List<BoardListViewEntity> boardListViewEntities) {
//         GetSearchBoardListResponseDto result = new GetSearchBoardListResponseDto(boardListViewEntities);
//         return ResponseEntity.status(HttpStatus.OK).body(result);
//     }

// }
package com.capstone.board_back.dto.response.board;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.board.BoardListItemResponseDto; // ✨ 이미 올바르게 import 되어 있습니다.
import com.capstone.board_back.dto.response.ResponseDto;
// import com.capstone.board_back.entity.BoardListViewEntity; // ✨ 이 DTO에서는 더 이상 직접 사용 안 하므로 주석 처리 또는 삭제

import lombok.Getter;

@Getter
public class GetSearchBoardListResponseDto extends ResponseDto {

    private List<BoardListItemResponseDto> searchList; // ✨ 필드 타입은 이미 올바르게 되어 있습니다.

    // ✨ 생성자 파라미터 타입을 List<BoardListItemResponseDto>로 변경합니다.
    private GetSearchBoardListResponseDto(List<BoardListItemResponseDto> boardListItemResponseDtos) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        // this.searchList = BoardListItem.getList(boardListViewEntities); // ✨ 기존 변환 로직 삭제
        this.searchList = boardListItemResponseDtos; // ✨ 직접 할당
    }

    // ✨ success 메소드 파라미터 타입을 List<BoardListItemResponseDto>로 변경합니다.
    public static ResponseEntity<GetSearchBoardListResponseDto> success(List<BoardListItemResponseDto> boardListItemResponseDtos) {
        GetSearchBoardListResponseDto result = new GetSearchBoardListResponseDto(boardListItemResponseDtos);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

}