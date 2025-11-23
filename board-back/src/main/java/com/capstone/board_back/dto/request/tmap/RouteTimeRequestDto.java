package com.capstone.board_back.dto.request.tmap;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteTimeRequestDto {
  private double startLat;
  private double startLng;
  private double endLat;
  private double endLng;
}
