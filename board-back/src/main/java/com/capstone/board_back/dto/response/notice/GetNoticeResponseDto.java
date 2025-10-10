package com.capstone.board_back.dto.response.notice;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.entity.NoticeEntity;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class GetNoticeResponseDto extends ResponseDto {

    private final Long id;
    private final String title;
    private final String content;
    private final String writerEmail;
    private final boolean pinned;
    private final String createdAt;
    private final String updatedAt;

    private GetNoticeResponseDto(NoticeEntity entity) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.id = entity.getId();
        this.title = entity.getTitle();
        this.content = entity.getContent();
        this.writerEmail = entity.getWriterEmail();
        this.pinned = entity.isPinned();
        this.createdAt = entity.getCreatedAt().toString();
        this.updatedAt = entity.getUpdatedAt().toString();
    }

    // ✅ 성공 응답
    public static ResponseEntity<GetNoticeResponseDto> success(NoticeEntity entity) {
        GetNoticeResponseDto result = new GetNoticeResponseDto(entity);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    // ✅ 공지 없음
    public static ResponseEntity<ResponseDto> notExistNotice() {
        ResponseDto result = new ResponseDto(
                ResponseCode.NOT_EXISTED_NOTICE,
                ResponseMessage.NOT_EXISTED_NOTICE
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    // ✅ DB 오류
    public static ResponseEntity<ResponseDto> databaseError() {
        ResponseDto result = new ResponseDto(
                ResponseCode.DATABASE_ERROR,
                ResponseMessage.DATABASE_ERROR
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
