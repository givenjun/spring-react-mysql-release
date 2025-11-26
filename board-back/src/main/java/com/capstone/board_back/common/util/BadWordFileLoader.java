package com.capstone.board_back.common.util;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Component
public class BadWordFileLoader {

    private static final String STRICT_PATH = "/app/config/badwords_strict.txt";
    private static final String LOOSE_PATH = "/app/config/badwords_loose.txt";

    private List<String> strictWords = new ArrayList<>();
    private List<String> looseWords = new ArrayList<>();

    @PostConstruct
    public void init() {
        strictWords = load(STRICT_PATH);
        looseWords = load(LOOSE_PATH);
    }

    private List<String> load(String path) {
        try {
            return Files.readAllLines(Paths.get(path))
                    .stream()
                    .filter(s -> !s.isBlank())
                    .toList();
        } catch (IOException e) {
            return List.of();
        }
    }

    public List<String> getStrictWords() {
        return strictWords;
    }

    public List<String> getLooseWords() {
        return looseWords;
    }

    public void reload() {
        init(); // 단순 재로드
    }
}

