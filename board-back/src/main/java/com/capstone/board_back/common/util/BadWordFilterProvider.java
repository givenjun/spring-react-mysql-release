package com.capstone.board_back.common.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 정적(static) 환경에서도 BadWordFilter Bean을 사용할 수 있도록 제공하는 Provider 클래스
 */
@Component
public class BadWordFilterProvider {

    private static BadWordFilter badWordFilter;

    @Autowired
    public BadWordFilterProvider(BadWordFilter filter) {
        BadWordFilterProvider.badWordFilter = filter;
    }

    public static BadWordFilter getFilter() {
        return badWordFilter;
    }
}
