package com.capstone.board_back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.verify.base-url}")
    private String verifyBaseUrl;

    /** 단순 텍스트 메일 전송 */
    public void sendText(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }

    /** 이메일 인증용 메일 전송 */
    public void sendVerifyEmail(String to, String rawToken) {
        String link = verifyBaseUrl + "?token=" + rawToken;
        String body = "안녕하세요!\n\n"
                + "아래 링크를 클릭해 이메일 인증을 완료해주세요:\n"
                + link + "\n\n"
                + "링크 유효기간: 24시간";
        sendText(to, "[RoutePick] 이메일 인증을 완료해주세요", body);
    }
}
