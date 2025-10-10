package com.capstone.board_back.provider;

import com.capstone.board_back.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${secret-key}")
    private String secretKey;

//    public String create(String email) {
//
//        Date expiredDate = Date.from(Instant.now().plus(1, ChronoUnit.HOURS));
//        Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
//
//        String jwt = Jwts.builder()
//                .signWith(key, SignatureAlgorithm.HS256)
//                .setSubject(email).setIssuedAt(new Date()).setExpiration(expiredDate)
//                .compact();
//
//        return jwt;
//    }

    // ✅ 관리자용 / role 포함 오버로딩
    public String create(String email, Role role) {
        Date expiredDate = Date.from(Instant.now().plus(1, ChronoUnit.HOURS));
        Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        String jwt = Jwts.builder()
                .signWith(key, SignatureAlgorithm.HS256)
                .setSubject(email)
                .claim("role", role.name()) // 👈 추가된 부분 (role 정보 포함)
                .setIssuedAt(new Date())
                .setExpiration(expiredDate)
                .compact();

        return jwt;
    }

    public String validate(String jwt) {

        Claims claims = null;
        Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        try {
            claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody();

        } catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }

        return claims.getSubject();
    }

    // ✅ role만 읽는 추가 메서드 (기존 코드에 영향 없음)
    public Role getRole(String jwt) {
        Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody();

            String role = claims.get("role", String.class);
            if (role == null) return Role.USER; // 기본 USER
            return Role.valueOf(role);
        } catch (Exception e) {
            return Role.USER;
        }
    }
}
