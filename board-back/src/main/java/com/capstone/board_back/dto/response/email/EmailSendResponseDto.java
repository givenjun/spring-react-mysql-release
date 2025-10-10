package com.capstone.board_back.dto.response.email;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class EmailSendResponseDto extends ResponseDto {

    private EmailSendResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }

    public static ResponseEntity<EmailSendResponseDto> success() {
        EmailSendResponseDto result = new EmailSendResponseDto();
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    public static ResponseEntity<ResponseDto> notExistUser() {
        ResponseDto result = new ResponseDto(ResponseCode.NOT_EXISTED_USER, ResponseMessage.NOT_EXISTED_USER);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    public static ResponseEntity<ResponseDto> alreadyVerified() {
        ResponseDto result = new ResponseDto("AV", "이미 인증된 계정입니다.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }
}
