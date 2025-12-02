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
        String adminEmail = "rtp_admin@routepick.net";
        String sub_adminEmail = "rtp_subadmin@routepick.net";
        if (userRepository.existsById(adminEmail) && userRepository.existsById(sub_adminEmail)) return;

        if (!userRepository.existsById(adminEmail)) {
            UserEntity admin = new UserEntity(
                    adminEmail,
                    new BCryptPasswordEncoder().encode("djemals1234"),
                    "관리자",
                    "010xxxxxxxx",
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
        if (!userRepository.existsById(sub_adminEmail)) {
            UserEntity sub_admin = new UserEntity(
                    sub_adminEmail,
                    new BCryptPasswordEncoder().encode("djemals1234"),
                    "부관리자",
                    "010yyyyyyyy",
                    "대전광역시 서구 둔산동",
                    "",
                    "",
                    true,
                    true,
                    Role.SUB_ADMIN // ✅ Role 추가
            );

            userRepository.save(sub_admin);
            System.out.println("✅ 부관리자 계정이 생성되었습니다: " + sub_adminEmail);
        }
    }
}
