package com.capstone.board_back.common.util;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.List;

@Component
@Getter
public class BadWordFileLoader {

    @Value("${badword.upload-dir}")
    private String uploadDir;

    private Set<String> strictWords;
    private Set<String> looseWords;
    private Set<String> regexPatterns;

    @PostConstruct
    public void init() {
        strictWords = loadAsSet("badwords_strict.txt");
        looseWords = loadAsSet("badwords_loose.txt");
        regexPatterns = loadAsSet("badwords_regex.txt");
    }

    private Set<String> loadAsSet(String filename) {
        try {
            Path path = Paths.get(uploadDir, filename);

            if (!Files.exists(path)) return Set.of();

            List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);

            return lines.stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet()); // ⭐ 중복 제거
        } catch (Exception e) {
            e.printStackTrace();
            return Set.of();
        }
    }

    public void reload() {
        init();
    }
}
