package com.capstone.board_back.common.config;

import com.capstone.board_back.common.util.BadWordFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class BadWordConfig {

    private static final String EXTERNAL_DIR = "/app/config/";

    // -------------------------------
    // 공통: 외부파일 우선 + 내부 fallback
    // -------------------------------
    private List<String> loadLines(String fileName) {
        try {
            Path externalPath = Paths.get(EXTERNAL_DIR + fileName);

            // 1) 외부 파일 존재 시 그걸 사용
            if (Files.exists(externalPath)) {
                return Files.lines(externalPath, StandardCharsets.UTF_8)
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toList();
            }

            // 2) classpath fallback
            var stream = getClass().getClassLoader().getResourceAsStream(fileName);
            if (stream == null)
                throw new RuntimeException("클래스패스 파일을 찾을 수 없습니다: " + fileName);

            var reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
            return reader.lines()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("파일 로딩 실패: " + fileName, e);
        }
    }

    private Set<String> loadSet(String fileName) {
        return loadLines(fileName).stream().collect(Collectors.toSet());
    }

    // -------------------------------
    // BadWordFilter Bean 생성
    // -------------------------------
    @Bean
    public BadWordFilter badWordFilter() {

        Set<String> strictWords = loadSet("badwords_strict.txt");
        Set<String> looseWords  = loadSet("badwords_loose.txt");

        // 파일 기반 정규식 리스트
        List<String> regexList = loadLines("badwords_regex.txt");

        return new BadWordFilter(strictWords, looseWords, regexList);
    }
}
