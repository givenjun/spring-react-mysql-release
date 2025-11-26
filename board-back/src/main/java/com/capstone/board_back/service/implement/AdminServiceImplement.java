package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.admin.*;
import com.capstone.board_back.entity.BoardEntity;
import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.repository.BoardRepository;
import com.capstone.board_back.repository.NoticeRepository;
import com.capstone.board_back.repository.UserRepository;
import com.capstone.board_back.service.AdminService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImplement implements AdminService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final NoticeRepository noticeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ResponseEntity<? super GetUserListResponseDto> getUserList() {
        try {
            List<UserEntity> userList = userRepository.findAll();
            return GetUserListResponseDto.success(userList);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

//    @Override
//    public ResponseEntity<? super DeleteUserResponseDto> deleteUser(String email) {
//        try {
//            if (!userRepository.existsById(email))
//                return DeleteUserResponseDto.notExistedUser();
//
//            userRepository.deleteById(email);
//            return DeleteUserResponseDto.success();
//
//        } catch (Exception exception) {
//            exception.printStackTrace();
//            return ResponseDto.databaseError();
//        }
//    }

    // ✅ [수정됨] Soft Delete (실제 삭제 X, 익명화 처리)
    @Override
    public ResponseEntity<? super DeleteUserResponseDto> deleteUser(String email) {
        try {
            // 1️⃣ 이메일로 유저 조회
            UserEntity user = userRepository.findByEmail(email);
            if (user == null)
                return DeleteUserResponseDto.notExistedUser();

            // 2️⃣ 이미 탈퇴된 회원이면 예외 처리
            if (user.isDeleted())
                return DeleteUserResponseDto.alreadyDeletedUser();

            // 3️⃣ Soft Delete (익명화 및 삭제 처리)
            user.markAsDeleted();
            userRepository.save(user);

            // 4️⃣ 성공 응답 반환
            return DeleteUserResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    // ✅ 비밀번호 변경 로직
    @Override
    public ResponseEntity<? super UpdateUserPasswordResponseDto> updateUserPassword(String email, String newPassword) {
        try {
            UserEntity user = userRepository.findByEmail(email);
            if (user == null) return UpdateUserPasswordResponseDto.noExistUser();

            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            userRepository.save(user);

            return UpdateUserPasswordResponseDto.success();
        } catch (Exception e) {
            e.printStackTrace();
            return UpdateUserPasswordResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super GetBoardListResponseDto> getBoardList() {
        try {
            List<BoardEntity> boardList = boardRepository.findAll();
            return GetBoardListResponseDto.success(boardList);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(Integer boardNumber) {
        try {
            if (!boardRepository.existsById(boardNumber))
                return DeleteBoardResponseDto.notExistedBoard();

            boardRepository.deleteById(boardNumber);
            return DeleteBoardResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super GetDashboardResponseDto> getDashboardData() {
        try {
            int userCount = (int) userRepository.count();
            int postCount = (int) boardRepository.count();
            int noticeCount = (int) noticeRepository.count();

            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            int newUsersThisWeek = userRepository.countByJoinedAtAfter(oneWeekAgo);
            int postsThisWeek = boardRepository.countByWriteDatetimeAfter(String.valueOf(oneWeekAgo));

            List<GetDashboardResponseDto.NoticeSummary> latestNotices = noticeRepository.findTop3ByOrderByCreatedAtDesc()
                    .stream()
                    .map(n -> new GetDashboardResponseDto.NoticeSummary(
                            n.getId(),
                            n.getTitle(),
                            n.getCreatedAt().toString().substring(0, 10)
                    ))
                    .collect(Collectors.toList());

            return GetDashboardResponseDto.success(
                    userCount, newUsersThisWeek, postCount, postsThisWeek, noticeCount, latestNotices
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super GetDashboardTrendResponseDto> getDashboardTrend() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate startDate = today.minusDays(6); // 최근 7일

            List<GetDashboardTrendResponseDto.TrendData> trendList = new ArrayList<>();

            for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
                LocalDateTime start = date.atStartOfDay();
                LocalDateTime end = date.plusDays(1).atStartOfDay();

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                String startStr = start.format(formatter);
                String endStr = end.format(formatter);

                int newUsers = userRepository.countByJoinedAtBetween(start, end);
                int newPosts = boardRepository.countByWriteDatetimeBetweenString(startStr, endStr);

                trendList.add(new GetDashboardTrendResponseDto.TrendData(
                        date.toString(), newUsers, newPosts
                ));
            }

            return GetDashboardTrendResponseDto.success(trendList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super PutRestoreUserResponseDto> restoreUser(String email) {
        try {
            // 1️⃣ 이메일로 유저 조회
            UserEntity user = userRepository.findByEmail(email);
            if (user == null)
                return PutRestoreUserResponseDto.notExistUser();

            // 2️⃣ 이미 탈퇴된 회원이면 예외 처리
            if (!user.isDeleted())
                return PutRestoreUserResponseDto.alreadyActive();

            // 3️⃣ Soft Delete (익명화 및 삭제 처리)
            user.restoreDeleted();
            userRepository.save(user);

            // 4️⃣ 성공 응답 반환
            return PutRestoreUserResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Value("${badword.upload-dir}")
    private String uploadDir;

    @Override
    public ResponseEntity<? super UploadBadWordResponseDto> uploadBadWordFiles(
            MultipartFile strict,
            MultipartFile loose,
            MultipartFile regex
    ) {
        try {
            // ❗ uploadDir 은 절대경로이므로 user.dir 을 절대 붙이면 안 된다
            String base = uploadDir + File.separator;

            // 디렉토리 생성
            File dir = new File(base);
            if (!dir.exists()) dir.mkdirs();

            if (strict != null && !strict.isEmpty())
                strict.transferTo(new File(base + "badwords_strict.txt"));

            if (loose != null && !loose.isEmpty())
                loose.transferTo(new File(base + "badwords_loose.txt"));

            if (regex != null && !regex.isEmpty())
                regex.transferTo(new File(base + "badwords_regex.txt"));

            return ResponseEntity.ok(new UploadBadWordResponseDto());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @Override
    public ResponseEntity<? super GetBadWordListResponseDto> getBadWordFiles() {
        try {
            String base = uploadDir + File.separator;

            List<String> strict = readLines(base + "badwords_strict.txt");
            List<String> loose = readLines(base + "badwords_loose.txt");
            List<String> regex = readLines(base + "badwords_regex.txt");

            return ResponseEntity.ok(new GetBadWordListResponseDto(strict, loose, regex));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    private List<String> readLines(String filePath) {
        try {
            Path path = Paths.get(filePath);   // ✔ 절대경로 그대로 사용
            return Files.readAllLines(path, StandardCharsets.UTF_8)
                    .stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}