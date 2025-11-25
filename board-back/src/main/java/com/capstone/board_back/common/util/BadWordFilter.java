package com.capstone.board_back.common.util;

import java.util.Set;
import java.util.regex.Pattern;

public class BadWordFilter {

    private final Set<String> strictWords;
    private final Set<String> looseWords;
    private final Pattern regexPattern;

    public BadWordFilter(Set<String> strictWords,
                         Set<String> looseWords,
                         Pattern regexPattern) {
        this.strictWords = strictWords;
        this.looseWords = looseWords;
        this.regexPattern = regexPattern;
    }

    // ----------------------------------------
    // 1) 텍스트 정규화
    // ----------------------------------------
    public String normalize(String text) {
        if (text == null) return "";
        return text
                .toLowerCase()
                .replaceAll("[^ㄱ-ㅎ가-힣a-z0-9]", "");
    }

    // ----------------------------------------
    // 2) 욕설 포함 여부 판정
    // ----------------------------------------
    public boolean containsBadWord(String text) {
        if (text == null || text.isBlank()) return false;

        String normalized = normalize(text);

        // strict 검사
        for (String w : strictWords) {
            if (normalized.contains(w)) return true;
        }

        // loose 검사
        for (String w : looseWords) {
            if (normalized.contains(w)) return true;
        }

        // regex 검사 (원문 + 정규화 둘 다)
        if (regexPattern.matcher(text).find()) return true;
        if (regexPattern.matcher(normalized).find()) return true;

        return false;
    }

    // ----------------------------------------
    // 3) 마스킹 처리
    // ----------------------------------------
    public String mask(String text) {
        if (text == null || text.isBlank()) return text;

        String masked = text;

        // strict 단어 마스킹
        for (String w : strictWords) {
            if (masked.contains(w)) {
                masked = masked.replace(w, "*".repeat(w.length()));
            }
        }

        // loose 단어 마스킹
        for (String w : looseWords) {
            if (masked.contains(w)) {
                masked = masked.replace(w, "***");
            }
        }

        // regex 우회 욕설 마스킹
        masked = regexPattern.matcher(masked).replaceAll("***");

        return masked;
    }
}
