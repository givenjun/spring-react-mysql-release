package com.capstone.board_back.dto.response.board;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.entity.BoardListViewEntity;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class BoardListItemResponseDto{
    private int boardNumber;
    private String title;
    // private String content; // 목록에서는 보통 내용을 다 보여주지 않으므로 필요에 따라 포함/제외
    private String boardTitleImage; // BoardListViewEntity의 titleImage 필드 사용
    private int favoriteCount;
    private int commentCount;
    private int viewCount;
    private String writeDatetime;
    private String writerNickname;
    private String writerProfileImage;
    private int imageCount; // ✨ 이미지 개수 필드 썸네일에 이미지 몇개더 있는지 알려주는 기능

    // 생성자
    public BoardListItemResponseDto(BoardListViewEntity boardListViewEntity, int imageCount) {
        this.boardNumber = boardListViewEntity.getBoardNumber();
        this.title = boardListViewEntity.getTitle();
        this.boardTitleImage = boardListViewEntity.getTitleImage();
        this.favoriteCount = boardListViewEntity.getFavoriteCount();
        this.commentCount = boardListViewEntity.getCommentCount();
        this.viewCount = boardListViewEntity.getViewCount();
        this.writeDatetime = boardListViewEntity.getWriteDatetime();
        this.writerNickname = boardListViewEntity.getWriterNickname();
        this.writerProfileImage = boardListViewEntity.getWriterProfileImage();
        this.imageCount = imageCount;//썸네일에 이미지 몇개더 있는지 알려주는 기능
    }
}