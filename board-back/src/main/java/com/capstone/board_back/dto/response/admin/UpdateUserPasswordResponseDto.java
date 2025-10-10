package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class UpdateUserPasswordResponseDto extends ResponseDto {

    private UpdateUserPasswordResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }

    public static ResponseEntity<UpdateUserPasswordResponseDto> success() {
        return ResponseEntity.status(HttpStatus.OK).body(new UpdateUserPasswordResponseDto());
    }

    public static ResponseEntity<ResponseDto> noExistUser() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDto(ResponseCode.NOT_EXISTED_USER, ResponseMessage.NOT_EXISTED_USER));
    }

    public static ResponseEntity<ResponseDto> databaseError() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ResponseDto(ResponseCode.DATABASE_ERROR, ResponseMessage.DATABASE_ERROR));
    }
}
