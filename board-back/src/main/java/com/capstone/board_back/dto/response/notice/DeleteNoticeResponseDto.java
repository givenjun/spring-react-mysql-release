package com.capstone.board_back.dto.response.notice;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class DeleteNoticeResponseDto extends ResponseDto {

    private DeleteNoticeResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }

    public static ResponseEntity<DeleteNoticeResponseDto> success() {
        DeleteNoticeResponseDto result = new DeleteNoticeResponseDto();
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    public static ResponseEntity<ResponseDto> notExistNotice() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NOT_EXISTED_NOTICE,
                ResponseMessage.NOT_EXISTED_NOTICE
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    public static ResponseEntity<ResponseDto> noPermission() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NO_PERMISSION,
                ResponseMessage.NO_PERMISSION
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
    }

    public static ResponseEntity<ResponseDto> databaseError() {
        ResponseDto result = new ResponseDto(
                ResponseCode.DATABASE_ERROR,
                ResponseMessage.DATABASE_ERROR
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
