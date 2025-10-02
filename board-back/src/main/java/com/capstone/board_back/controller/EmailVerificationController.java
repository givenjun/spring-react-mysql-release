package com.capstone.board_back.controller;

import com.capstone.board_back.dto.response.email.EmailConfirmResponseDto;
import com.capstone.board_back.dto.response.email.EmailSendResponseDto;
import com.capstone.board_back.dto.request.email.EmailSendRequestDto;
import com.capstone.board_back.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/auth/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    // 📌 인증 메일 재전송
    @PostMapping("/send")
    public ResponseEntity<? super EmailSendResponseDto> send(
            @RequestBody @Valid EmailSendRequestDto dto
    ) {
        return emailVerificationService.issueToken(dto.getEmail());
    }

    // 📌 인증 완료 처리 (리다이렉트는 기존 코드 유지)
    @GetMapping("/confirm")
    public ResponseEntity<Void> confirm(@RequestParam("token") String token) {
        ResponseEntity<? super EmailConfirmResponseDto> result =
                emailVerificationService.confirmToken(token);

        if (result.getBody() instanceof EmailConfirmResponseDto responseDto) {
            if ("SU".equals(responseDto.getCode())) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create("http://localhost:3000/email-verified-success"))
                        .build();
            }
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("http://localhost:3000/email-verified-fail"))
                .build();
    }
}

