package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class DeleteBadWordResponseDto extends ResponseDto {

    private DeleteBadWordResponseDto(String code, String message) {
        super(code, message);
    }

    public static ResponseEntity<DeleteBadWordResponseDto> success() {
        return ResponseEntity.ok(new DeleteBadWordResponseDto(ResponseCode.SUCCESS, ResponseMessage.SUCCESS));
    }

    public static ResponseEntity<ResponseDto> invalidType() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDto("IVT", "Invalid badword type"));
    }

    public static ResponseEntity<ResponseDto> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ResponseDto("NOT_FOUND", "Word not found"));
    }

    public static ResponseEntity<ResponseDto> databaseError() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ResponseDto(ResponseCode.DATABASE_ERROR, ResponseMessage.DATABASE_ERROR));
    }
}

