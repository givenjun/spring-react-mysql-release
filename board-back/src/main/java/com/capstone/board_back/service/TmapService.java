package com.capstone.board_back.service;

import com.capstone.board_back.dto.request.tmap.RouteTimeRequestDto;
import com.capstone.board_back.dto.response.tmap.GetRouteTimeResponseDto;

public interface TmapService {
  GetRouteTimeResponseDto getRouteTime(RouteTimeRequestDto dto);
}
