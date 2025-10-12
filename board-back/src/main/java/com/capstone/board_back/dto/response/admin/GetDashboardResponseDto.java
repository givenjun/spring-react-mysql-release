package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetDashboardResponseDto extends ResponseDto {

    private int userCount;
    private int newUsersThisWeek;
    private int postCount;
    private int postsThisWeek;
    private int noticeCount;
    private List<NoticeSummary> latestNotices;

    @Getter
    public static class NoticeSummary {
        private Long id;
        private String title;
        private String createdAt;

        public NoticeSummary(Long id, String title, String createdAt) {
            this.id = id;
            this.title = title;
            this.createdAt = createdAt;
        }
    }

    private GetDashboardResponseDto(
            int userCount,
            int newUsersThisWeek,
            int postCount,
            int postsThisWeek,
            int noticeCount,
            List<NoticeSummary> latestNotices
    ) {
        super("SU", "Success");
        this.userCount = userCount;
        this.newUsersThisWeek = newUsersThisWeek;
        this.postCount = postCount;
        this.postsThisWeek = postsThisWeek;
        this.noticeCount = noticeCount;
        this.latestNotices = latestNotices;
    }

    public static ResponseEntity<GetDashboardResponseDto> success(
            int userCount,
            int newUsersThisWeek,
            int postCount,
            int postsThisWeek,
            int noticeCount,
            List<NoticeSummary> latestNotices
    ) {
        GetDashboardResponseDto result = new GetDashboardResponseDto(
                userCount, newUsersThisWeek, postCount, postsThisWeek, noticeCount, latestNotices
        );
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }
}
