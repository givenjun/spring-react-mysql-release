package com.capstone.board_back.service.implement;

import com.capstone.board_back.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImplement implements MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;  // 발신자 (구글 계정)

    @Value("${app.email.verify.base-url}")
    private String baseUrl;  // http://localhost:3000/verify-email 같은 프론트 경로

    @Override
    public void sendVerifyEmail(String to, String token) {
        try {
            String subject = "[RoutePick] 이메일 인증 안내";
            String verificationLink = baseUrl + "?token=" + token;

            String text = "안녕하세요, RoutePick 팀입니다.\n\n"
                    + "아래 링크를 클릭하여 이메일 인증을 완료해주세요.\n\n"
                    + verificationLink + "\n\n"
                    + "해당 링크는 24시간 동안만 유효합니다.\n"
                    + "감사합니다.";

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("이메일 인증 메일 발송 성공: {}", to);

        } catch (Exception e) {
            log.error("이메일 발송 실패", e);
            throw new RuntimeException("메일 발송 실패");
        }
    }
}
