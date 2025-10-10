package com.capstone.board_back.dto.response.notice;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.entity.NoticeEntity;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetNoticeListResponseDto extends ResponseDto {

    private final List<NoticeEntity> noticeList;

    private GetNoticeListResponseDto(List<NoticeEntity> noticeList) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.noticeList = noticeList;
    }

    // ✅ 성공 시
    public static ResponseEntity<GetNoticeListResponseDto> success(List<NoticeEntity> noticeList) {
        GetNoticeListResponseDto result = new GetNoticeListResponseDto(noticeList);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    // ✅ DB 에러 시
    public static ResponseEntity<ResponseDto> databaseError() {
        ResponseDto result = new ResponseDto(ResponseCode.DATABASE_ERROR, ResponseMessage.DATABASE_ERROR);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
