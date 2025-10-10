package com.capstone.board_back.service.implement;

import com.capstone.board_back.service.MailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailServiceImplement implements MailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String from;

  @Value("${cors.back-origin}")
  private String backOrigin;

  @Async // ✨ 비동기 처리
  @Override
  public void sendVerifyEmail(String email, String token) {
    try {
      String subject = "회원가입 이메일 인증";
      String verificationUrl = backOrigin + "/api/v1/auth/email/confirm?token=" + token;
      String content = "아래 링크를 클릭하여 이메일 인증을 완료해주세요:\n" + verificationUrl;

      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

      helper.setFrom(from);
      helper.setTo(email);
      helper.setSubject(subject);
      helper.setText(content, false);

      mailSender.send(message);

      System.out.println("✅ 이메일 전송 성공: " + email);

    } catch (Exception e) {
      e.printStackTrace();
      System.err.println("❌ 이메일 전송 실패: " + email);
    }
  }
}
