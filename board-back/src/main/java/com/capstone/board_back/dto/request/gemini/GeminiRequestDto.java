package com.capstone.board_back.dto.request.gemini;

import lombok.Data; // Lombok을 사용하여 Getter, Setter, toString 등 자동 생성

@Data
public class GeminiRequestDto {
    private String prompt;
}