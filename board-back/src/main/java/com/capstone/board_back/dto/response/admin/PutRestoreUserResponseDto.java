package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class PutRestoreUserResponseDto extends ResponseDto {

    private PutRestoreUserResponseDto(String code, String message) {
        super(code, message);
    }

    // ✅ 회원 복구 성공
    public static ResponseEntity<PutRestoreUserResponseDto> success() {
        PutRestoreUserResponseDto responseBody =
                new PutRestoreUserResponseDto(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        return ResponseEntity.status(HttpStatus.OK).body(responseBody);
    }

    // ✅ 존재하지 않는 회원
    public static ResponseEntity<ResponseDto> notExistUser() {
        ResponseDto responseBody =
                new ResponseDto(ResponseCode.NOT_EXISTED_USER, ResponseMessage.NOT_EXISTED_USER);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
    }

    // ✅ 이미 활성화된 회원
    public static ResponseEntity<ResponseDto> alreadyActive() {
        ResponseDto responseBody =
                new ResponseDto(ResponseCode.ALREADY_ACTIVE_USER, ResponseMessage.ALREADY_ACTIVE_USER);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
    }

    // ✅ 데이터베이스 에러 (예외 처리용)
    public static ResponseEntity<ResponseDto> databaseError() {
        return ResponseDto.databaseError();
    }
}
