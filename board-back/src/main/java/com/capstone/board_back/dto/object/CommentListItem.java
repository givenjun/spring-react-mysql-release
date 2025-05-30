package com.capstone.board_back.dto.object;

import com.capstone.board_back.repository.resultSet.GetCommentListResultSet;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentListItem {

    private int commentNumber;      // ✨ 필드 추가
    private String nickname;
    private String profileImage;
    private String writeDatetime;
    private String content;
    private String userEmail;       // ✨ 필드 추가

    public CommentListItem(GetCommentListResultSet resultSet) {
        this.commentNumber = resultSet.getCommentNumber();    // ✨ 매핑 추가
        this.nickname = resultSet.getNickname();
        this.profileImage = resultSet.getProfileImage();
        this.writeDatetime = resultSet.getWriteDatetime();
        this.content = resultSet.getContent();
        this.userEmail = resultSet.getUserEmail();        // ✨ 매핑 추가
    }

    public static List<CommentListItem> copyList(List<GetCommentListResultSet> resultSets) {
        List<CommentListItem> list = new ArrayList<>();
        for (GetCommentListResultSet resultSet : resultSets) {
            CommentListItem correspondingItem = new CommentListItem(resultSet);
            list.add(correspondingItem);
        }
        return list;
    }

}
