package com.capstone.board_back.service;

import com.capstone.board_back.dto.request.notice.PatchNoticeRequestDto;
import com.capstone.board_back.dto.request.notice.PostNoticeRequestDto;
import com.capstone.board_back.dto.response.notice.*;
import org.springframework.http.ResponseEntity;

public interface NoticeService {

    // ✅ 공지사항 등록 (관리자 전용)
    ResponseEntity<? super PostNoticeResponseDto> postNotice(
            PostNoticeRequestDto dto,
            String adminEmail
    );

    // ✅ 공지사항 수정 (관리자 전용)
    ResponseEntity<? super PatchNoticeResponseDto> patchNotice(
            Long id,
            PatchNoticeRequestDto dto,
            String adminEmail
    );

    // ✅ 공지사항 전체 조회 (모두 접근 가능)
    ResponseEntity<? super GetNoticeListResponseDto> getNoticeList();

    // ✅ 공지사항 상세 조회 (모두 접근 가능)
    ResponseEntity<? super GetNoticeResponseDto> getNotice(Long id);

    // ✅ 공지사항 삭제 (관리자 전용)
    ResponseEntity<? super DeleteNoticeResponseDto> deleteNotice(
            Long id,
            String adminEmail
    );
}
