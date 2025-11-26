package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class AddBadWordResponseDto extends ResponseDto {

    private AddBadWordResponseDto(String code, String message) {
        super(code, message);
    }

    public static ResponseEntity<AddBadWordResponseDto> success() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(new AddBadWordResponseDto(ResponseCode.SUCCESS, ResponseMessage.SUCCESS));
    }

    public static ResponseEntity<ResponseDto> invalidType() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDto("IVT", "Invalid badword type"));
    }

    public static ResponseEntity<ResponseDto> alreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ResponseDto("EXIST", "Already exists"));
    }

    public static ResponseEntity<ResponseDto> databaseError() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ResponseDto(ResponseCode.DATABASE_ERROR, ResponseMessage.DATABASE_ERROR));
    }
}
