package com.capstone.board_back.common.util;

import java.util.Set;

public class BadWordFilter {

    private final Set<String> strictWords;
    private final Set<String> looseWords;
    private final Set<String> regexPatterns;

    public BadWordFilter(
            Set<String> strictWords,
            Set<String> looseWords,
            Set<String> regexPatterns
    ) {
        this.strictWords = strictWords;
        this.looseWords = looseWords;
        this.regexPatterns = regexPatterns;
    }

    // ================================
    // ⭐ 필터링 함수
    // ================================
    public String mask(String text) {
        if (text == null) return null;

        String result = text;

        // 1) strict 단순치환
        for (String w : strictWords) {
            result = result.replace(w, "***");
        }

        // 2) loose 단순치환 (공백, 초성 포함 단어들)
        for (String w : looseWords) {
            result = result.replace(w, "***");
        }

        // 3) regex 패턴 처리
        for (String pattern : regexPatterns) {
            result = result.replaceAll(pattern, "***");
        }

        return result;
    }
}
