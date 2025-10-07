package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.entity.BoardEntity;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetBoardListResponseDto extends ResponseDto {

    private List<BoardEntity> boardList;

    private GetBoardListResponseDto(List<BoardEntity> boardList) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.boardList = boardList;
    }

    public static ResponseEntity<GetBoardListResponseDto> success(List<BoardEntity> boardList) {
        GetBoardListResponseDto responseBody = new GetBoardListResponseDto(boardList);
        return ResponseEntity.status(HttpStatus.OK).body(responseBody);
    }
}
