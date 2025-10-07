package com.capstone.board_back.filter;

import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EmailVerificationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    // 이메일 인증이 필요한 경로 리스트
    private final List<String> protectedEndpoints = List.of(
            "/api/v1/board",
            "/api/v1/comment",
            "/api/v1/favorite"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean needVerification = protectedEndpoints.stream().anyMatch(path::startsWith);

        if (!needVerification) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authentication.getName();
        UserEntity user = userRepository.findById(email).orElse(null);
        if (user == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ 이메일 미인증이면 차단
        if (!user.getEmailVerified()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"이메일 인증이 필요합니다.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
