package com.capstone.board_back.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String askGemini(String prompt) {
        // 1. 전체 URL 생성
        String requestUrl = apiUrl + "?key=" + apiKey;

        // 2. 요청 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. 요청 본문(Body) 생성
        // Gemini API가 요구하는 JSON 형식에 맞게 Map을 생성합니다.
        Map<String, Object> parts = Map.of("text", prompt);
        Map<String, Object> contents = Map.of("parts", Collections.singletonList(parts));
        Map<String, Object> requestBody = Map.of("contents", Collections.singletonList(contents));

        // 4. HttpEntity 객체 생성 (헤더 + 본문)
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // 5. POST 요청 보내기 및 응답 받기
            // Map으로 응답을 받아서 필요한 텍스트만 추출합니다.
            Map<String, Object> response = restTemplate.postForObject(requestUrl, entity, Map.class);
            
            // 6. 응답 파싱하여 텍스트 추출 (복잡한 DTO 없이 Map으로 처리)
            // response -> candidates -> [0] -> content -> parts -> [0] -> text
            return response.values().stream()
                .flatMap(v -> ((java.util.List<?>) v).stream())
                .map(candidate -> (Map<?, ?>) candidate)
                .findFirst()
                .map(candidate -> (Map<?, ?>) candidate.get("content"))
                .map(content -> (java.util.List<?>) content.get("parts"))
                .flatMap(partsList -> partsList.stream().findFirst())
                .map(part -> (Map<?, ?>) part)
                .map(part -> (String) part.get("text"))
                .orElse("응답에서 텍스트를 추출할 수 없습니다.");

        } catch (Exception e) {
            log.error("Gemini API 호출 중 오류 발생: {}", e.getMessage());
            return "API 호출에 실패했습니다: " + e.getMessage();
        }
    }
}
