package com.capstone.board_back.dto.response.auth;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
@JsonPropertyOrder({ "code", "message", "token", "expirationTime" })
public class SignInResponseDto extends ResponseDto {

    private String token;
    private int expirationTime;


    private SignInResponseDto(String token) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.token = token;
        this.expirationTime = 3600;
    }

    public static ResponseEntity<SignInResponseDto> success(String token) {
        SignInResponseDto result = new SignInResponseDto(token);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    public static ResponseEntity<ResponseDto> signInFail() {
        ResponseDto result = new ResponseDto(ResponseCode.SIGN_IN_FAIL, ResponseMessage.SIGN_IN_FAIL);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
    }

    public static ResponseEntity<ResponseDto> emailNotVerified() {
        ResponseDto result = new ResponseDto("NEV", "이메일 인증이 필요합니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
    }

    public static ResponseEntity<ResponseDto> deletedUser() {
        ResponseDto result =
                new ResponseDto("DU", "탈퇴한 회원입니다. 로그인할 수 없습니다.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
    }
}
