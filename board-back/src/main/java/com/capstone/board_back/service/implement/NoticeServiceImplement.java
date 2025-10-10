package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.request.notice.PatchNoticeRequestDto;
import com.capstone.board_back.dto.request.notice.PostNoticeRequestDto;
import com.capstone.board_back.dto.response.notice.*;
import com.capstone.board_back.entity.NoticeEntity;
import com.capstone.board_back.repository.NoticeRepository;
import com.capstone.board_back.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeServiceImplement implements NoticeService {

    private final NoticeRepository noticeRepository;

    // ✅ 공지 등록 (ADMIN 전용)
    @Override
    public ResponseEntity<? super PostNoticeResponseDto> postNotice(PostNoticeRequestDto dto, String adminEmail) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated())
                return PostNoticeResponseDto.noPermission();

            boolean isAdmin = authentication.getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            if (!isAdmin) return PostNoticeResponseDto.noPermission();

            String email = (String) authentication.getPrincipal();

            NoticeEntity entity = NoticeEntity.builder()
                    .title(dto.getTitle())
                    .content(dto.getContent())
                    .writerEmail(email)
                    .pinned(dto.isPinned())
                    .build();

            noticeRepository.save(entity);
            return PostNoticeResponseDto.success();

        } catch (Exception e) {
            e.printStackTrace();
            return PostNoticeResponseDto.databaseError();
        }
    }

    // ✅ 공지 수정 (ADMIN 전용)
    @Override
    public ResponseEntity<? super PatchNoticeResponseDto> patchNotice(Long id, PatchNoticeRequestDto dto, String adminEmail) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated())
                return PatchNoticeResponseDto.noPermission();

            boolean isAdmin = authentication.getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            if (!isAdmin) return PatchNoticeResponseDto.noPermission();

            NoticeEntity notice = noticeRepository.findById(id).orElse(null);
            if (notice == null) return PatchNoticeResponseDto.notExistNotice();

            notice.setTitle(dto.getTitle());
            notice.setContent(dto.getContent());
            notice.setPinned(dto.isPinned());
            noticeRepository.save(notice);

            return PatchNoticeResponseDto.success();

        } catch (Exception e) {
            e.printStackTrace();
            return PatchNoticeResponseDto.databaseError();
        }
    }

    // ✅ 공지 삭제 (ADMIN 전용)
    @Override
    public ResponseEntity<? super DeleteNoticeResponseDto> deleteNotice(Long id, String adminEmail) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated())
                return DeleteNoticeResponseDto.noPermission();

            boolean isAdmin = authentication.getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            if (!isAdmin) return DeleteNoticeResponseDto.noPermission();

            NoticeEntity notice = noticeRepository.findById(id).orElse(null);
            if (notice == null)
                return DeleteNoticeResponseDto.notExistNotice();

            noticeRepository.delete(notice);
            return DeleteNoticeResponseDto.success();

        } catch (Exception e) {
            e.printStackTrace();
            return DeleteNoticeResponseDto.databaseError();
        }
    }

    // ✅ 공지 리스트 조회 (변경 없음)
    @Override
    public ResponseEntity<? super GetNoticeListResponseDto> getNoticeList() {
        try {
            List<NoticeEntity> notices = noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc();
            return GetNoticeListResponseDto.success(notices);
        } catch (Exception e) {
            e.printStackTrace();
            return GetNoticeListResponseDto.databaseError();
        }
    }

    // ✅ 공지 단일 조회 (변경 없음)
    @Override
    public ResponseEntity<? super GetNoticeResponseDto> getNotice(Long id) {
        try {
            NoticeEntity notice = noticeRepository.findById(id).orElse(null);
            if (notice == null) return GetNoticeResponseDto.notExistNotice();
            return GetNoticeResponseDto.success(notice);
        } catch (Exception e) {
            e.printStackTrace();
            return GetNoticeResponseDto.databaseError();
        }
    }
}
