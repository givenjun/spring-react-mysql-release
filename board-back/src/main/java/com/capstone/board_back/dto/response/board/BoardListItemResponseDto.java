package com.capstone.board_back.dto.response.board;

import com.capstone.board_back.entity.BoardListViewEntity;
import lombok.Getter;

@Getter
public class BoardListItemResponseDto {

    private Integer boardNumber;
    private String title;
    private String content;
    private String boardTitleImage;
    private String writerNickname;
    private String writerProfileImage;
    private String writeDatetime;
    private int commentCount;
    private int favoriteCount;
    private int viewCount;
    private int imageCount;

    /**
     * 🔥 마스킹까지 완료된 값으로 DTO를 생성하는 방식
     * Service 계층에서 mask() 호출한 값을 그대로 넣어야 함
     */
    public BoardListItemResponseDto(
            BoardListViewEntity entity,
            int imageCount,
            String maskedTitle,
            String maskedContent,
            String maskedNickname
    ) {
        this.boardNumber = entity.getBoardNumber();
        this.title = maskedTitle;              // ★ 마스킹된 제목 주입
        this.content = maskedContent;          // ★ 마스킹된 내용 주입
        this.boardTitleImage = entity.getTitleImage();
        this.writerNickname = maskedNickname;  // ★ 마스킹된 닉네임 주입
        this.writerProfileImage = entity.getWriterProfileImage();
        this.writeDatetime = entity.getWriteDatetime();
        this.commentCount = entity.getCommentCount();
        this.favoriteCount = entity.getFavoriteCount();
        this.viewCount = entity.getViewCount();
        this.imageCount = imageCount;
    }
}
