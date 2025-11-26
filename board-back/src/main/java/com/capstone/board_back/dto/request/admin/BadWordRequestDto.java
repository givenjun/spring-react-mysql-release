package com.capstone.board_back.dto.request.admin;

import lombok.Getter;

@Getter
public class BadWordRequestDto {
    private String type;   // strict / loose / regex
    private String word;   // 추가/삭제할 단어
}