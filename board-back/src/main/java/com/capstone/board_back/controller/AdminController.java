package com.capstone.board_back.controller;

import com.capstone.board_back.dto.request.admin.BadWordRequestDto;
import com.capstone.board_back.dto.response.admin.*;
import com.capstone.board_back.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ✅ 회원 전체 조회
    @GetMapping("/user-list")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super GetUserListResponseDto> getUserList() {
        ResponseEntity<? super GetUserListResponseDto> response = adminService.getUserList();
        return response;
    }

    // ✅ 특정 회원 삭제
    @DeleteMapping("/user/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super DeleteUserResponseDto> deleteUser(
            @PathVariable("email") String email
    ) {
        ResponseEntity<? super DeleteUserResponseDto> response = adminService.deleteUser(email);
        return response;
    }

    // ✅ 회원 복구 (PUT)
    @PutMapping("/user/restore/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super PutRestoreUserResponseDto> restoreUser(@PathVariable("email") String email) {
        return adminService.restoreUser(email);
    }

    // ✅ 회원 비밀번호 변경
    @PatchMapping("/user/{email}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super UpdateUserPasswordResponseDto> updateUserPassword(
            @PathVariable("email") String email,
            @RequestBody Map<String, String> requestBody
    ) {
        String newPassword = requestBody.get("newPassword");
        ResponseEntity<? super UpdateUserPasswordResponseDto> response =
                adminService.updateUserPassword(email, newPassword);
        return response;
    }

    // ✅ 게시글 전체 조회
    @GetMapping("/board-list")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super GetBoardListResponseDto> getBoardList() {
        ResponseEntity<? super GetBoardListResponseDto> response = adminService.getBoardList();
        return response;
    }

    // ✅ 게시글 삭제
    @DeleteMapping("/board/{boardNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(
            @PathVariable("boardNumber") Integer boardNumber
    ) {
        ResponseEntity<? super DeleteBoardResponseDto> response = adminService.deleteBoard(boardNumber);
        return response;
    }

    // ✅ 대시보드 요약 정보
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super GetDashboardResponseDto> getDashboard() {
        return adminService.getDashboardData();
    }

    // ✅ 대시보드 차트 정보
    @GetMapping("/dashboard/trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super GetDashboardTrendResponseDto> getDashboardTrend() {
        return adminService.getDashboardTrend();
    }

    // ===============================
    // 🔥 신규 추가: 욕설 필터 파일 관리
    // ===============================

    // 1️⃣ 욕설 파일 업로드 (strict / loose / regex)
    @PostMapping("/badwords/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super UploadBadWordResponseDto> uploadBadWordFiles(
            @RequestPart(value = "strict", required = false) MultipartFile strict,
            @RequestPart(value = "loose", required = false) MultipartFile loose,
            @RequestPart(value = "regex", required = false) MultipartFile regex
    ) {
        return adminService.uploadBadWordFiles(strict, loose, regex);
    }

    // 2️⃣ 현재 파일 내용 조회 (strict + loose + regex)
    @GetMapping("/badwords")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<? super GetBadWordListResponseDto> getBadWordFiles() {
        return adminService.getBadWordFiles();
    }

    @PostMapping("/badwords/add")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<?> addBadWord(@RequestBody BadWordRequestDto dto) {
        return adminService.addBadWord(dto.getType(), dto.getWord());
    }

    @DeleteMapping("/badwords/delete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
    public ResponseEntity<?> deleteBadWord(@RequestBody BadWordRequestDto dto) {
        return adminService.deleteBadWord(dto.getType(), dto.getWord());
    }

    @DeleteMapping("/badwords/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetBadWords() {
        return adminService.resetBadWords();
    }

}
