package com.capstone.board_back.repository;

import com.capstone.board_back.entity.EmailVerificationTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, Long> {

    void deleteByUserEmail(String userEmail);

    @Query("SELECT t FROM EmailVerificationTokenEntity t " +
            "WHERE t.tokenHash = :tokenHash " +
            "AND t.expiresAt > :now " +
            "AND t.usedAt IS NULL")
    Optional<EmailVerificationTokenEntity> findValidToken(
            @Param("tokenHash") String tokenHash,
            @Param("now") LocalDateTime now
    );
}
