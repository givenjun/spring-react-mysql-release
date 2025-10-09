package com.capstone.board_back.controller;

import com.capstone.board_back.dto.response.admin.*;
import com.capstone.board_back.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ✅ 회원 전체 조회
    @GetMapping("/user-list")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super GetBoardListResponseDto> getBoardList() {
        ResponseEntity<? super GetBoardListResponseDto> response = adminService.getBoardList();
        return response;
    }

    // ✅ 게시글 삭제
    @DeleteMapping("/board/{boardNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(
            @PathVariable("boardNumber") Integer boardNumber
    ) {
        ResponseEntity<? super DeleteBoardResponseDto> response = adminService.deleteBoard(boardNumber);
        return response;
    }
}
