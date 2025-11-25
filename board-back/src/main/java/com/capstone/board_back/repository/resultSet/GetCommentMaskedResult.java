package com.capstone.board_back.repository.resultSet;

public class GetCommentMaskedResult implements GetCommentListResultSet {

    private final GetCommentListResultSet origin;
    private final String maskedContent;
    private final String maskedNickname;

    public GetCommentMaskedResult(
            GetCommentListResultSet origin,
            String maskedContent,
            String maskedNickname
    ) {
        this.origin = origin;
        this.maskedContent = maskedContent;
        this.maskedNickname = maskedNickname;
    }

    @Override
    public Integer getCommentNumber() {
        return origin.getCommentNumber();
    }

    @Override
    public String getUserEmail() {
        return origin.getUserEmail();
    }

    @Override
    public String getNickname() {
        return maskedNickname;   // ★ 닉네임 필터링 적용
    }

    @Override
    public String getProfileImage() {
        return origin.getProfileImage();
    }

    @Override
    public String getWriteDatetime() {
        return origin.getWriteDatetime();
    }

    @Override
    public String getContent() {
        return maskedContent;    // ★ 내용 필터링 적용
    }
}
