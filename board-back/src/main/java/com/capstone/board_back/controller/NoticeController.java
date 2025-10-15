package com.capstone.board_back.controller;

import com.capstone.board_back.dto.request.notice.PatchNoticeRequestDto;
import com.capstone.board_back.dto.request.notice.PostNoticeRequestDto;
import com.capstone.board_back.dto.response.notice.*;
import com.capstone.board_back.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/notice")  // ✅ 리소스 중심 RESTful 구조
@RequiredArgsConstructor
@Validated
public class NoticeController {

    private final NoticeService noticeService;

    // ✅ 공지사항 전체 조회 (모두 접근 가능)
    @GetMapping("")
    public ResponseEntity<? super GetNoticeListResponseDto> getNoticeList() {
        ResponseEntity<? super GetNoticeListResponseDto> response = noticeService.getNoticeList();
        return response;
    }

    // ✅ 공지사항 상세 조회 (모두 접근 가능)
    @GetMapping("/{id}")
    public ResponseEntity<? super GetNoticeResponseDto> getNotice(@PathVariable("id") Long id) {
        ResponseEntity<? super GetNoticeResponseDto> response = noticeService.getNotice(id);
        return response;
    }

    // ✅ 공지사항 등록 (관리자 전용)
    @PostMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super PostNoticeResponseDto> postNotice(
            @RequestBody @Valid PostNoticeRequestDto requestBody,
            @AuthenticationPrincipal String email
    ) {
        ResponseEntity<? super PostNoticeResponseDto> response = noticeService.postNotice(requestBody, email);
        return response;
    }

    // ✅ 공지사항 수정 (관리자 전용)
    @PatchMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super PatchNoticeResponseDto> patchNotice(
            @PathVariable("id") Long id,
            @RequestBody @Valid PatchNoticeRequestDto requestBody,
            @AuthenticationPrincipal String email
    ) {
        ResponseEntity<? super PatchNoticeResponseDto> response = noticeService.patchNotice(id, requestBody, email);
        return response;
    }

    // ✅ 공지사항 삭제 (관리자 전용)
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super DeleteNoticeResponseDto> deleteNotice(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal String email
    ) {
        ResponseEntity<? super DeleteNoticeResponseDto> response = noticeService.deleteNotice(id, email);
        return response;
    }
}
