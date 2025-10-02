package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.email.EmailConfirmResponseDto;
import com.capstone.board_back.dto.response.email.EmailSendResponseDto;
import com.capstone.board_back.entity.EmailVerificationTokenEntity;
import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.repository.EmailVerificationTokenRepository;
import com.capstone.board_back.repository.UserRepository;
import com.capstone.board_back.service.EmailVerificationService;
import com.capstone.board_back.service.MailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImplement implements EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final MailService mailService;

    // 📌 비동기 메일 발송만 전담
    @Async
    public void sendVerificationEmailAsync(String email, String rawToken) {
        try {
            mailService.sendVerifyEmail(email, rawToken);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    @Transactional
    public ResponseEntity<? super EmailSendResponseDto> issueToken(String email) {
        try {
            UserEntity user = userRepository.findByEmail(email);
            if (user == null) return EmailSendResponseDto.notExistUser();
            if (Boolean.TRUE.equals(user.getEmailVerified())) return EmailSendResponseDto.alreadyVerified();

            // 기존 토큰 제거
            tokenRepository.deleteByUserEmail(email);

            // 새로운 토큰 생성
            String rawToken = UUID.randomUUID().toString();
            String hash = sha256(rawToken);

            EmailVerificationTokenEntity token = new EmailVerificationTokenEntity();
            token.setUserEmail(email);
            token.setTokenHash(hash);
            token.setExpiresAt(LocalDateTime.now().plusHours(24));
            tokenRepository.save(token);

            // 📩 메일 발송만 비동기로
            sendVerificationEmailAsync(email, rawToken);

            return EmailSendResponseDto.success();

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    @Transactional
    public ResponseEntity<? super EmailConfirmResponseDto> confirmToken(String rawToken) {
        try {
            String hash = sha256(rawToken);
            Optional<EmailVerificationTokenEntity> tokenOpt =
                    tokenRepository.findValidToken(hash, LocalDateTime.now());

            if (tokenOpt.isEmpty()) return EmailConfirmResponseDto.invalidToken();

            EmailVerificationTokenEntity token = tokenOpt.get();

            if (token.getExpiresAt().isBefore(LocalDateTime.now()))
                return EmailConfirmResponseDto.tokenExpired();

            UserEntity userEntity = userRepository.findByEmail(token.getUserEmail());
            if (userEntity == null) return EmailConfirmResponseDto.notExistUser();

            userEntity.setEmailVerified(true);
            userRepository.save(userEntity);

            token.setUsedAt(LocalDateTime.now());
            tokenRepository.save(token);

            return EmailConfirmResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    private String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

