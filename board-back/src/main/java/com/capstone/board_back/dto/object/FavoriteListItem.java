package com.capstone.board_back.dto.object;

import com.capstone.board_back.common.util.BadWordFilter;
import com.capstone.board_back.common.util.BadWordFilterProvider;
import com.capstone.board_back.repository.resultSet.GetFavoriteListResultSet;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteListItem {

    private String email;
    private String nickname;
    private String profileImage;

    public FavoriteListItem(GetFavoriteListResultSet resultSet, BadWordFilter filter) {
        this.email = resultSet.getEmail();
        this.nickname = filter.mask(resultSet.getNickname());  // ★ 마스킹 적용
        this.profileImage = resultSet.getProfileImage();
    }

    public static List<FavoriteListItem> copyList(
            List<GetFavoriteListResultSet> resultSets,
            BadWordFilterProvider provider
    ) {
        BadWordFilter filter = provider.getFilter();
        List<FavoriteListItem> list = new ArrayList<>();

        for (GetFavoriteListResultSet rs : resultSets) {
            list.add(new FavoriteListItem(rs, filter));
        }
        return list;
    }
}
