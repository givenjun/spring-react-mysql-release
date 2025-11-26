package com.capstone.board_back.common.util;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BadWordFilterProvider {

    private final BadWordFileLoader loader;

    public BadWordFilter getFilter() {
        return new BadWordFilter(
                loader.getStrictWords(),
                loader.getLooseWords(),
                loader.getRegexPatterns()
        );
    }

    // 🔥 새로 추가해야 하는 부분
    public void reload() {
        loader.reload();
    }
}
