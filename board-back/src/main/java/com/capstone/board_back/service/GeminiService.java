package com.capstone.board_back.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${kakao.api.key}") // ✅ application.properties에서 카카오 API 키 주입
    private String kakaoApiKey;

    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String searchLocationWithKakao(String placeName) {
    String url = "https://dapi.kakao.com/v2/local/search/keyword.json";

    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "KakaoAK " + kakaoApiKey);

    URI uri = UriComponentsBuilder.fromHttpUrl(url)
            .queryParam("query", placeName)
            .queryParam("size", 5)
            .encode(StandardCharsets.UTF_8)
            .build()
            .toUri();

    HttpEntity<String> entity = new HttpEntity<>(headers);

    try {
            // ✅ 3. RestTemplate의 응답 타입을 String으로 받아 유연성을 높입니다.
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            // ✅ 4. 응답 본문을 ObjectMapper를 사용해 더 안전하게 파싱합니다.
            Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
            
            List<Map<String, Object>> documents = (List<Map<String, Object>>) body.getOrDefault("documents", Collections.emptyList());

            if (documents.isEmpty()) {
                return "[]";
            }

            // ✅ 5. 각 document에서 값을 추출할 때, null일 경우를 대비해 기본값을 설정합니다.
            List<Map<String, String>> results = documents.stream().map(doc -> Map.of(
                    "id", String.valueOf(doc.getOrDefault("id", "")),
                    "place_name", String.valueOf(doc.getOrDefault("place_name", "이름 없음")),
                    "y", String.valueOf(doc.getOrDefault("y", "0.0")),
                    "x", String.valueOf(doc.getOrDefault("x", "0.0")),

                    "road_address_name", String.valueOf(doc.getOrDefault("road_address_name", "")),
                    "category_name", String.valueOf(doc.getOrDefault("category_name", "")),
                    "phone", String.valueOf(doc.getOrDefault("phone", ""))
            )).collect(Collectors.toList());

            return objectMapper.writeValueAsString(results);

        } catch (HttpClientErrorException e) {
            log.error("Kakao API 호출 중 클라이언트 오류 발생 ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "[]";
        } catch (Exception e) {
            log.error("Kakao API 처리 중 예외 발생", e);
            return "[]";
        }
    }

    public String askGemini(String prompt) {
        // 1. 전체 URL 생성
        String requestUrl = apiUrl + "?key=" + apiKey;

        // 2. 요청 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // GeminiService.java 의 systemInstruction 변수

        String systemInstruction = """
        You are a professional, friendly, and conversational map expert and local guide based in South Korea.
        Your primary goal is to help users find places or have a pleasant conversation.
        You have two ways to respond:

        1.  **For Location-based Requests:** If the user asks for a recommendation, a specific location, or a search, you MUST respond with a single, raw JSON object.
            This object MUST have two keys: "comment" and "places".
            - "comment": Your preliminary thoughts or a summary of why you chose the recommended places. This should be a friendly, conversational string.
            - "places": A JSON array of place objects. The number of objects should be based on the user's request (e.g., "the closest" means one, "recommend some" means a few).
            - Each object in the "places" array must contain: "place_name", "address", "menu", "reason", "review_summary".

        2.  **For General Conversation:** If the user's request is not about finding a location (e.g., greetings, simple questions), you MUST respond with a simple text-based JSON object: { "type": "text", "content": "Your conversational response here." }.

        Strictly adhere to one of these two JSON formats.

        ---
        **Example 1: User asks for recommendations**
        User Request: "대전 시청 근처에서 점심 먹기 좋은 파스타 맛집 알려줘"
        Your JSON response:
        {
        "comment": "대전 시청 근처에는 맛있는 파스타 집이 많아요! 그 중에서도 분위기와 맛 모두 잡은 두 곳을 추천해 드릴게요.",
        "places": [
            {
            "place_name": "비스트로퍼블릭",
            "address": "대전 서구 둔산중로4번길 20",
            "menu": "- 봉골레 파스타: 16,000원\\n- 라구 파스타: 18,000원",
            "reason": "신선한 재료로 만든 이탈리안 요리를 맛볼 수 있는 곳이에요. 특히 파스타와 리조또가 훌륭해서 점심시간에 직장인들에게 인기가 많습니다.",
            "review_summary": "방문객들은 '분위기가 좋고 음식 맛이 뛰어나다'는 긍정적인 평가를 남겼습니다."
            },
            {
            "place_name": "칸 스테이크하우스",
            "address": "대전 서구 둔산남로105번길 22",
            "menu": "- 런치 스테이크: 25,000원\\n- 안심 스테이크: 48,000원",
            "reason": "고급스러운 분위기에서 최상급 스테이크를 즐길 수 있는 곳으로, 특별한 날 점심 식사에 아주 적합합니다.",
            "review_summary": "리뷰에 따르면 '스테이크 굽기가 완벽하고 육즙이 풍부하다'는 평이 많으며, '기념일에 방문하기 좋다'는 추천이 많습니다."
            }
        ]
        }

        ---
        **Example 2: User asks for a specific place**
        User Request: "한밭대학교에서 가장 가까운 다이소 어딨어?"
        Your JSON response:
        {
        "comment": "한밭대학교에서 가장 가까운 다이소는 '다이소 대전한밭대점'이에요!",
        "places": [
            {
                "place_name": "다이소 대전한밭대점",
                "address": "대전 유성구 학하서로121번길 55-13",
                "menu": "다양한 생활용품",
                "reason": "한밭대학교에서 가장 가까운 다이소 매장입니다.",
                "review_summary": "학생들이 자취 용품을 구매하기 위해 자주 방문하는 곳입니다."
            }
        ]
        }

        ---
        **Example 3: User has a general conversation**
        User Request: "안녕?"
        Your JSON response:
        {
        "type": "text",
        "content": "안녕하세요! 오늘 무엇을 도와드릴까요? 맛집이나 카페, 아니면 가고 싶은 곳이 있으신가요?"
        }
        """;

        String finalPrompt = systemInstruction + "\n\nUser: " + prompt;

        // 3. 요청 본문(Body) 생성
        // Gemini API가 요구하는 JSON 형식에 맞게 Map을 생성합니다.
        Map<String, Object> parts = Map.of("text", finalPrompt);
        Map<String, Object> content = Map.of("parts", Collections.singletonList(parts));

        Map<String, Object> googleSearch = Map.of("google_search", Collections.emptyMap());
        Map<String, Object> googleMaps = Map.of("google_maps", Collections.emptyMap());
        List<Map<String, Object>> tools = Arrays.asList(googleSearch, googleMaps);

        Map<String, Object> generationConfig = Map.of("temperature", 1.0);

        Map<String, Object> requestBody = Map.of(
            "contents", Collections.singletonList(content),
            "tools", tools,
            "generationConfig", generationConfig
        );
        // 4. HttpEntity 객체 생성 (헤더 + 본문)
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> geminiResponse = restTemplate.postForObject(requestUrl, entity, Map.class);
            
            String geminiResultText = ((List<Map<String, Object>>) geminiResponse.get("candidates")).stream()
                    .findFirst()
                    .map(c -> (Map<String, Object>) c.get("content"))
                    .map(c -> (List<Map<String, Object>>) c.get("parts"))
                    .flatMap(p -> p.stream().findFirst())
                    .map(p -> (String) p.get("text"))
                    .orElse("{\"type\": \"error\", \"content\": \"추천 장소를 찾지 못했어요.\"}");

            // ✅ 2. Markdown 코드 블록을 제거하는 로직은 그대로 유지합니다.
            String cleanedJson = geminiResultText.trim();
            if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(cleanedJson.indexOf('{'), cleanedJson.lastIndexOf('}') + 1);
            }
            
            // ✅ 3. 완성된 JSON 문자열을 그대로 프론트엔드에 반환합니다.
            return cleanedJson;

        } catch (Exception e) {
            log.error("askGemini 메소드 처리 중 예외 발생", e); 
            return "{\"type\": \"error\", \"content\": \"요청 처리 중 오류가 발생했습니다.\"}";
        }
    }
}