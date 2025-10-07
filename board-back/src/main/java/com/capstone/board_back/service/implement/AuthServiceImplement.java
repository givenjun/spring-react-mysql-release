package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.request.auth.SignInRequestDto;
import com.capstone.board_back.dto.request.auth.SignUpRequestDto;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.auth.SignInResponseDto;
import com.capstone.board_back.dto.response.auth.SignUpResponseDto;
import com.capstone.board_back.entity.Role;
import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.provider.JwtProvider;
import com.capstone.board_back.repository.UserRepository;
import com.capstone.board_back.service.AuthService;
import com.capstone.board_back.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImplement implements AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final EmailVerificationService emailVerificationService;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public ResponseEntity<? super SignUpResponseDto> signUp(SignUpRequestDto dto) {

        try {

            String email = dto.getEmail();
            boolean existedEmail = userRepository.existsByEmail(email);
            if (existedEmail) return SignUpResponseDto.duplicateEmail();

            String nickname = dto.getNickname();
            boolean existedNickname = userRepository.existsByNickname(nickname);
            if (existedNickname) return SignUpResponseDto.duplicateNickname();

            String telNumber = dto.getTelNumber();
            boolean existedTelNumber = userRepository.existsByTelNumber(telNumber);
            if (existedTelNumber) return SignUpResponseDto.duplicateTelNumber();

            String password = dto.getPassword();
            String encodedPassword = passwordEncoder.encode(password);
            dto.setPassword(encodedPassword);

            UserEntity userEntity = new UserEntity(dto);
            userRepository.save(userEntity);

            // ✅ 이메일 인증 메일 자동 발송
            emailVerificationService.issueToken(userEntity.getEmail());


        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return SignUpResponseDto.success();

    }

    @Override
    public ResponseEntity<? super SignInResponseDto> signIn(SignInRequestDto dto) {

        String token = null;

        try {

            String email = dto.getEmail();
            UserEntity userEntity = userRepository.findByEmail(email);
            if (userEntity == null) return SignInResponseDto.signInFail();

            String password = dto.getPassword();
            String encodedPassword = userEntity.getPassword();
            boolean isMatched = passwordEncoder.matches(password, encodedPassword);
            if (!isMatched) return SignInResponseDto.signInFail();

            // ✅ 이메일 인증 여부 확인 추가
            if (!userEntity.getEmailVerified()) {
                return SignInResponseDto.emailNotVerified();
            }

            // ✅ role 정보를 JWT에 추가해서 발급
            token = jwtProvider.create(email, Role.valueOf(userEntity.getRole().name()));

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }

        return SignInResponseDto.success(token);

    }
}
