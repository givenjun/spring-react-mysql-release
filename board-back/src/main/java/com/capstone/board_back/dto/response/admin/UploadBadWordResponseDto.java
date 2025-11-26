package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class UploadBadWordResponseDto extends ResponseDto {

    private UploadBadWordResponseDto(String code, String message) {
        super(code, message);
    }

    public static ResponseEntity<UploadBadWordResponseDto> success() {
        UploadBadWordResponseDto responseBody =
                new UploadBadWordResponseDto(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        return ResponseEntity.status(HttpStatus.OK).body(responseBody);
    }
}
