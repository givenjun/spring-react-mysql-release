package com.capstone.board_back.service;

import com.capstone.board_back.dto.response.search.GetPopularListResponseDto;
import com.capstone.board_back.dto.response.search.GetRelationListResponseDto;
import org.springframework.http.ResponseEntity;

public interface SearchService {

    ResponseEntity<? super GetPopularListResponseDto> getPopularList();
    ResponseEntity<? super GetRelationListResponseDto> getRelationList(String searchWord);
}
