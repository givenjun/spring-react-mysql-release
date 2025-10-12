package com.capstone.board_back.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capstone.board_back.dto.request.gemini.GeminiRecommendRequestDto;
import com.capstone.board_back.dto.request.gemini.GeminiRequestDto;
import com.capstone.board_back.service.GeminiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/gemini") // 기본 요청 매핑 경로 설정
@RequiredArgsConstructor
@Slf4j
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping(value = "/ask", produces = "application/json; charset=UTF-8") // POST 요청으로 변경, 요청 바디에서 prompt를 받음
    public ResponseEntity<String> askGemini(@RequestBody GeminiRequestDto request) {
        String prompt = request.getPrompt();
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("{\"type\": \"error\", \"content\": \"프롬프트는 비어있을 수 없습니다.\"}");
        }
        String response = geminiService.askGemini(prompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/map-search")
    public ResponseEntity<String> searchPlaceOnMap(@RequestBody GeminiRecommendRequestDto request) {
        // ✅ 1. 요청이 컨트롤러에 잘 도착했는지 로그로 확인
        log.info("'/map-search' 요청 도착. 검색어: {}", request.getSearchQuery());

        String searchQuery = request.getSearchQuery();
        if (searchQuery == null || searchQuery.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("[]");
        }
        
        try {
            String kakaoApiResponse = geminiService.searchLocationWithKakao(searchQuery);
            // ✅ 2. 서비스가 성공적으로 결과를 반환했는지 로그로 확인
            log.info("카카오로부터 받은 응답 : {}", kakaoApiResponse);
            log.info("카카오 API 검색 성공. 응답 길이: {}", kakaoApiResponse.length());
            return ResponseEntity.ok(kakaoApiResponse);
        } catch (Exception e) {
            // ✅ 3. 서비스 실행 중 에러가 발생했는지 로그로 확인
            log.error("'/map-search' 처리 중 예외 발생", e);
            // 에러 발생 시 500 Internal Server Error 상태 코드와 함께 에러 메시지를 반환
            return ResponseEntity.internalServerError().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
