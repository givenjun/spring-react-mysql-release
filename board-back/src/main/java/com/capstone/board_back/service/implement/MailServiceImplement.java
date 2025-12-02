package com.capstone.board_back.service.implement;

import com.capstone.board_back.service.MailService;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailServiceImplement implements MailService {

  private String loadHtmlTemplate(String verifyUrl) throws Exception {
    ClassPathResource resource =
        new ClassPathResource("templates/email/templates/verify-email.html");

    String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

    return html.replace("{{VERIFY_URL}}", verifyUrl);
  }

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String from;

  @Value("${cors.back-origin}")
  private String backOrigin;

  @Async
  @Override
  public void sendVerifyEmail(String email, String token) {
    try {
      String subject = "RoutePick 회원가입 이메일 인증";

      // 토큰으로 인증 URL 생성
      String verifyUrl = backOrigin + "/api/v1/auth/email/confirm?token=" + token;

      // HTML 템플릿에서 URL 끼워넣기
      String htmlContent = loadHtmlTemplate(verifyUrl);

      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setTo(email);
      helper.setSubject(subject);
      helper.setFrom(from);
      helper.setText(htmlContent, true); // HTML 모드

      mailSender.send(message);

      System.out.println("✅ 이메일 전송 성공: " + email);

    } catch (Exception e) {
      e.printStackTrace();
      System.err.println("❌ 이메일 전송 실패: " + email);
    }
  }
}
