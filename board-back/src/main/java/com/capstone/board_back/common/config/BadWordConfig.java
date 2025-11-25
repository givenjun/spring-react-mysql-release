package com.capstone.board_back.common.config;

import com.capstone.board_back.common.util.BadWordFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Configuration
public class BadWordConfig {

    private Set<String> loadList(String fileName) {
        try {
            var stream = getClass().getClassLoader().getResourceAsStream(fileName);
            var reader = new BufferedReader(
                    new InputStreamReader(stream, StandardCharsets.UTF_8)
            );
            return reader.lines()
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .collect(Collectors.toSet());

        } catch (Exception e) {
            throw new RuntimeException("욕설 파일 로딩 실패: " + fileName, e);
        }
    }

    @Bean
    public BadWordFilter badWordFilter() {

        Set<String> strictWords = loadList("badwords_strict.txt");
        Set<String> looseWords  = loadList("badwords_loose.txt");

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
                        "[tT]l[qQ]kf|Wls|" +
                        "[ㅂ]신|[ㅅ]발|[ㅈ]밥";

        Pattern pattern = Pattern.compile(regex);

        return new BadWordFilter(strictWords, looseWords, pattern);
    }
}
