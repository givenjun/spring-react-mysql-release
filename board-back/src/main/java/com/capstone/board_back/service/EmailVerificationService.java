package com.capstone.board_back.service;

import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.email.EmailSendResponseDto;
import com.capstone.board_back.dto.response.email.EmailConfirmResponseDto;
import org.springframework.http.ResponseEntity;

public interface EmailVerificationService {

    // 인증 완료 처리
    ResponseEntity<? super EmailConfirmResponseDto> confirmToken(String rawToken);

    // 재전송 API (컨트롤러에서 직접 쓰도록 설계)
    ResponseEntity<? super EmailSendResponseDto> issueToken(String email);
}

