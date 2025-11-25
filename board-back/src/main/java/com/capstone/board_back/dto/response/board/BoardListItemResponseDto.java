package com.capstone.board_back.dto.response.board;

import com.capstone.board_back.common.util.BadWordFilter;
import com.capstone.board_back.common.util.BadWordFilterProvider;
import com.capstone.board_back.entity.BoardListViewEntity;
import lombok.Getter;

@Getter
public class BoardListItemResponseDto {

    private Integer boardNumber;
    private String title;
    private String content;
    private String boardTitleImage;   // ★ 추가됨 — 프론트에서 사용하는 썸네일 이미지
    private String writerNickname;
    private String writerProfileImage;
    private String writeDatetime;
    private int commentCount;
    private int favoriteCount;
    private int viewCount;
    private int imageCount;

    public BoardListItemResponseDto(BoardListViewEntity boardListViewEntity, int imageCount) {

        BadWordFilter filter = BadWordFilterProvider.getFilter();

        this.boardNumber = boardListViewEntity.getBoardNumber();

        // ★ 제목 필터링
        this.title = filter.mask(boardListViewEntity.getTitle());

        // ★ 내용도 필터링 (짧게라도 들어있다면)
        this.content = filter.mask(boardListViewEntity.getContent() == null ? "" : boardListViewEntity.getContent());

        // ★ 썸네일 이미지(titleImage) 적용
        this.boardTitleImage = boardListViewEntity.getTitleImage();

        // 작성자 정보
        this.writerNickname = filter.mask(boardListViewEntity.getWriterNickname());
        this.writerProfileImage = boardListViewEntity.getWriterProfileImage();

        // 메타데이터
        this.writeDatetime = boardListViewEntity.getWriteDatetime();
        this.commentCount = boardListViewEntity.getCommentCount();
        this.favoriteCount = boardListViewEntity.getFavoriteCount();
        this.viewCount = boardListViewEntity.getViewCount();
        this.imageCount = imageCount;
    }
}
