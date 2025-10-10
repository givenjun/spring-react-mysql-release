package com.capstone.board_back.config;

import com.capstone.board_back.entity.Role;
import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeedConfig implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@routepick.com";
        if (userRepository.existsById(adminEmail)) return;

        UserEntity admin = new UserEntity(
                adminEmail,
                new BCryptPasswordEncoder().encode("admin1234"),
                "관리자",
                "010-1234-5678",
                "대전광역시 서구 둔산동",
                "",
                "",
                true,
                true,
                Role.ADMIN // ✅ Role 추가
        );
        userRepository.save(admin);
        System.out.println("✅ 관리자 계정이 생성되었습니다: " + adminEmail);
    }
}
