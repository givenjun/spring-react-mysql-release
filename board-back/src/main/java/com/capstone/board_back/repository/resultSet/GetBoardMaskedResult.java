package com.capstone.board_back.repository.resultSet;

public class GetBoardMaskedResult implements GetBoardResultSet {

    private final GetBoardResultSet origin;
    private final String maskedTitle;
    private final String maskedContent;
    private final String maskedNickname;

    public GetBoardMaskedResult(GetBoardResultSet origin,
                                String maskedTitle,
                                String maskedContent,
                                String maskedNickname) {
        this.origin = origin;
        this.maskedTitle = maskedTitle;
        this.maskedContent = maskedContent;
        this.maskedNickname = maskedNickname;
    }

    @Override
    public Integer getBoardNumber() { return origin.getBoardNumber(); }

    @Override
    public String getTitle() { return maskedTitle; }

    @Override
    public String getContent() { return maskedContent; }

    @Override
    public String getWriteDatetime() { return origin.getWriteDatetime(); }

    @Override
    public String getWriterEmail() { return origin.getWriterEmail(); }

    @Override
    public String getWriterNickname() { return maskedNickname; }

    @Override
    public String getWriterProfileImage() { return origin.getWriterProfileImage(); }

    @Override
    public Integer getViewCount() { return origin.getViewCount(); }
}
