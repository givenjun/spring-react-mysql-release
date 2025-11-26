package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResetBadWordResponseDto extends ResponseDto {

    private ResetBadWordResponseDto(String code, String message) {
        super(code, message);
    }

    public static ResponseEntity<ResetBadWordResponseDto> success() {
        return ResponseEntity.ok(new ResetBadWordResponseDto(ResponseCode.SUCCESS, ResponseMessage.SUCCESS));
    }

    public static ResponseEntity<ResponseDto> databaseError() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ResponseDto(ResponseCode.DATABASE_ERROR, ResponseMessage.DATABASE_ERROR));
    }
}

