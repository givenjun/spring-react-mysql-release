package com.capstone.board_back.dto.request.notice;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PatchNoticeRequestDto {
    private String title;
    private String content;
    private boolean pinned;
}
