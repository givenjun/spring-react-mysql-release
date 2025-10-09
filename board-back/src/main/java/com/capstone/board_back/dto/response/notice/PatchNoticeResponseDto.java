package com.capstone.board_back.dto.response.notice;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class PatchNoticeResponseDto extends ResponseDto {

    private PatchNoticeResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }

    // ✅ 성공 응답
    public static ResponseEntity<PatchNoticeResponseDto> success() {
        PatchNoticeResponseDto result = new PatchNoticeResponseDto();
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    // ✅ 공지사항 존재하지 않음
    public static ResponseEntity<ResponseDto> notExistNotice() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NOT_EXISTED_NOTICE,
                ResponseMessage.NOT_EXISTED_NOTICE
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    // ✅ 권한 없음
    public static ResponseEntity<ResponseDto> noPermission() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NO_PERMISSION,
                ResponseMessage.NO_PERMISSION
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
    }

}
