package com.capstone.board_back.dto.request.gemini;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GeminiRecommendRequestDto {
    private String searchQuery;
}
