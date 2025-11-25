package com.capstone.board_back.common.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

public class BadWordFilterTest {

    private BadWordFilter filter;

    private Set<String> loadList(String fileName) throws Exception {
        var stream = getClass().getClassLoader().getResourceAsStream(fileName);
        assertNotNull(stream, "파일 존재하지 않음: " + fileName);

        var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(stream, StandardCharsets.UTF_8)
        );

        return reader.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .collect(Collectors.toSet());
    }

    @BeforeEach
    void setup() throws Exception {
        Set<String> strict = loadList("badwords_strict.txt");
        Set<String> loose  = loadList("badwords_loose.txt");

        // 테스트용 정규식 (필요 시 실제 정규식 그대로 넣어도 됨)
        String regex =
                "[시씨씪슈쓔쉬쉽쒸쓉](?:[0-9]*|[0-9]+ *)[바발벌빠빡빨뻘파팔펄]|" +
                        "[섊좆좇졷좄좃좉졽썅춍봊]|" +
                        "[ㅈ조][0-9]*까|" +
                        "ㅅㅣㅂㅏㄹ?|" +
                        "ㅂ[0-9]*ㅅ|" +
                        "[ㅄᄲᇪᄺᄡᄣᄦᇠ]|" +
                        "[ㅅㅆᄴ][0-9]*[ㄲㅅㅆᄴㅂ]|" +
                        "[존좉좇][0-9 ]*나|" +
                        "[자보][0-9]+지|" +
                        "보빨|" +
                        "[봊봋봇봈볻봁봍] *[빨이]|" +
                        "[후훚훐훛훋훗훘훟훝훑][장앙]|" +
                        "[엠앰]창|" +
                        "애[미비]|애자|" +
                        "[가-탏탑-힣]색기|" +
                        "새 *[키퀴]|" +
                        "[병븅][0-9]*[신딱딲]|" +
                        "미친[가-닣닥-힣]|" +
                        "[믿밑]힌|" +
                        // 필요 시 이어서 추가 가능
                        "[tT]l[qQ]kf|Wls|" +
                        "[ㅂ]신|[ㅅ]발|[ㅈ]밥";
        Pattern pattern = Pattern.compile(regex);

        filter = new BadWordFilter(strict, loose, pattern);
    }

    @Test
    void strictTest() {
        assertTrue(filter.containsBadWord("씨발 뭐하냐"));
        assertTrue(filter.containsBadWord("좆같네 진짜"));
    }

    @Test
    void looseTest() {
        assertTrue(filter.containsBadWord("ㅅㅂ 이게 왜 안돼"));
        assertTrue(filter.containsBadWord("sibal 뭐함"));
    }

    @Test
    void regexTest() {
        assertTrue(filter.containsBadWord("시1발 뭐함"));   // 숫자 치환
        assertTrue(filter.containsBadWord("시!발 왜그래")); // 특수문자 치환
        assertTrue(filter.containsBadWord("s1bal huh?"));    // 영문 치환
        assertTrue(filter.containsBadWord("tlqkf ㅋㅋ"));    // 영타 욕설
    }

    @Test
    void maskTest() {
        String t1 = filter.mask("시1발 테스트");
        assertTrue(t1.contains("***")); // regex 마스킹

        String t2 = filter.mask("ㅅ ㅂ 왜저럼?");
        assertTrue(t2.contains("***"));
    }

    @Test
    void normalizeTest() {
        assertEquals("씨발", filter.normalize(" 씨발!! "));
        assertEquals("sibal", filter.normalize("S i B a l!"));
    }
}
