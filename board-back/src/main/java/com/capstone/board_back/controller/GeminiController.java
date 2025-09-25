package com.capstone.board_back.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capstone.board_back.dto.request.gemini.GeminiRequestDto;
import com.capstone.board_back.service.GeminiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/gemini") // 기본 요청 매핑 경로 설정
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping("/ask") // POST 요청으로 변경, 요청 바디에서 prompt를 받음
    public ResponseEntity<String> askGemini(@RequestBody GeminiRequestDto request) {
        String prompt = request.getPrompt();
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("프롬프트는 비어있을 수 없습니다.");
        }
        String response = geminiService.askGemini(prompt);
        return ResponseEntity.ok(response);
    }
}
