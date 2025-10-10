package com.capstone.board_back.service;

import com.capstone.board_back.dto.response.admin.*;
import org.springframework.http.ResponseEntity;

public interface AdminService {
    ResponseEntity<? super GetUserListResponseDto> getUserList();
    ResponseEntity<? super DeleteUserResponseDto> deleteUser(String email);
    ResponseEntity<? super UpdateUserPasswordResponseDto> updateUserPassword(String email, String newPassword);
    ResponseEntity<? super GetBoardListResponseDto> getBoardList();
    ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(Integer boardNumber);
    ResponseEntity<? super GetDashboardResponseDto> getDashboardData();
    ResponseEntity<? super GetDashboardTrendResponseDto> getDashboardTrend();
}
