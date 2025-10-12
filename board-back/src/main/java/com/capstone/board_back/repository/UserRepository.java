package com.capstone.board_back.repository;

import com.capstone.board_back.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    boolean existsByTelNumber(String telNumber);

    int countByJoinedAtAfter(LocalDateTime joinedAt);
    int countByJoinedAtBetween(LocalDateTime start, LocalDateTime end);

    UserEntity findByEmail(String email);

}
