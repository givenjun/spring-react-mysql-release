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
// public class GetTop3BoardListResponseDto extends ResponseDto{

//     private List<BoardListItem> top3List;

//     private GetTop3BoardListResponseDto(List<BoardListViewEntity> boardListViewEntities) {
//         super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
//         this.top3List = BoardListItem.getList(boardListViewEntities);
//     }

//     public static ResponseEntity<GetTop3BoardListResponseDto> success(List<BoardListViewEntity> boardListViewEntities){
//         GetTop3BoardListResponseDto result = new GetTop3BoardListResponseDto(boardListViewEntities);
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
public class GetTop3BoardListResponseDto extends ResponseDto {

    // private List<BoardListItem> top3List; // ✨ 기존 필드 타입
    private List<BoardListItemResponseDto> top3List;   // ✨ 새로운 DTO 타입으로 변경

    // private GetTop3BoardListResponseDto(List<BoardListViewEntity> boardListViewEntities) { // ✨ 기존 생성자
    private GetTop3BoardListResponseDto(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        // this.top3List = BoardListItem.getList(boardListViewEntities); // ✨ 기존 변환 로직 삭제
        this.top3List = boardListItemResponseDtos; // ✨ 직접 할당
    }

    // public static ResponseEntity<GetTop3BoardListResponseDto> success(List<BoardListViewEntity> boardListViewEntities) { // ✨ 기존 success 메소드
    public static ResponseEntity<GetTop3BoardListResponseDto> success(List<BoardListItemResponseDto> boardListItemResponseDtos) { // ✨ 새로운 DTO 리스트를 받도록 변경
        GetTop3BoardListResponseDto result = new GetTop3BoardListResponseDto(boardListItemResponseDtos);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

}