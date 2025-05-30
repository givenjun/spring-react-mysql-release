package com.capstone.board_back.repository.resultSet;

public interface GetCommentListResultSet {

    Integer getCommentNumber(); // ✨ 추가: 댓글 번호를 위한 getter
    String getUserEmail();    // ✨ 추가: 사용자 이메일을 위한 getter
    String getNickname();
    String getProfileImage();
    String getWriteDatetime();
    String getContent();

}
