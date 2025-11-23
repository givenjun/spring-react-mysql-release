package com.capstone.board_back.dto.response.tmap;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;

@Getter
public class GetRouteTimeResponseDto extends ResponseDto {

  private int totalTimeSeconds;
  private int totalDistanceMeters;
  private int durationMinutes;
  private String formatted;

  private GetRouteTimeResponseDto(
      int totalTimeSeconds, int totalDistanceMeters, int durationMinutes, String formatted) {
    super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    this.totalTimeSeconds = totalTimeSeconds;
    this.totalDistanceMeters = totalDistanceMeters;
    this.durationMinutes = durationMinutes;
    this.formatted = formatted;
  }

  public static GetRouteTimeResponseDto success(
      int totalTimeSeconds, int totalDistanceMeters, int durationMinutes, String formatted) {
    return new GetRouteTimeResponseDto(
        totalTimeSeconds, totalDistanceMeters, durationMinutes, formatted);
  }
}
