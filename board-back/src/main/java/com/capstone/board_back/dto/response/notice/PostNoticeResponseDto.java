package com.capstone.board_back.dto.response.notice;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class PostNoticeResponseDto extends ResponseDto {

    private PostNoticeResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }

    // ✅ 성공 응답
    public static ResponseEntity<PostNoticeResponseDto> success() {
        PostNoticeResponseDto result = new PostNoticeResponseDto();
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    // ✅ 존재하지 않는 유저 (예시)
    public static ResponseEntity<ResponseDto> notExistUser() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NOT_EXISTED_USER,
                ResponseMessage.NOT_EXISTED_USER
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
    }

    // ✅ 권한 없음 (예시)
    public static ResponseEntity<ResponseDto> noPermission() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NO_PERMISSION,
                ResponseMessage.NO_PERMISSION
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
    }

}
