package com.capstone.board_back.entity;

import com.capstone.board_back.dto.request.auth.SignUpRequestDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity(name="user")
@Table(name="user")
public class UserEntity {

    @Id
    private String email;
    private String password;
    private String nickname;
    private String telNumber;
    private String address;
    private String addressDetail;
    private String profileImage;
    private boolean agreedPersonal;
    private boolean emailVerified = false;

    // ✅ 관리자 권한 추가
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER; // 기본값 USER

    // ✅ 추가: Soft Delete 관련 필드
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ✅ 신규 추가: 가입일시
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    public UserEntity(SignUpRequestDto dto) {
        this.email = dto.getEmail();
        this.password = dto.getPassword();
        this.nickname = dto.getNickname();
        this.telNumber = dto.getTelNumber();
        this.address = dto.getAddress();
        this.addressDetail = dto.getAddressDetail();
        this.agreedPersonal = dto.getAgreedPersonal();
        this.emailVerified = false;
        this.joinedAt = LocalDateTime.now(); // ✅ 자동 가입일 저장
        this.isDeleted = false;
    }

    // ✅ 관리자 계정 초기화를 위한 생성자 (AdminSeedConfig용)
    public UserEntity(
            String email,
            String password,
            String nickname,
            String telNumber,
            String address,
            String addressDetail,
            String profileImage,
            boolean agreedPersonal,
            boolean emailVerified,
            Role role
    ) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.telNumber = telNumber;
        this.address = address;
        this.addressDetail = addressDetail;
        this.profileImage = profileImage;
        this.agreedPersonal = agreedPersonal;
        this.emailVerified = emailVerified;
        this.role = role;

        this.isDeleted = false;
        this.joinedAt = LocalDateTime.now(); // 자동 가입일
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public void setPassword(String password) { this.password = password; }

    // ✅ 관리자 승격용 메서드
    public void promoteToAdmin() {
        this.role = Role.ADMIN;
    }

    // ✅ Soft Delete 처리 메서드 (추가)
    public void markAsDeleted() {
        int randomNumber = ThreadLocalRandom.current().nextInt(1_000_000);
        String randomId = String.format("%06d", randomNumber);
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.nickname = "탈퇴회원" + randomId;
        this.profileImage = null;
    }
}
