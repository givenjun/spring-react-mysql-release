package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.request.tmap.RouteTimeRequestDto;
import com.capstone.board_back.dto.response.tmap.GetRouteTimeResponseDto;
import com.capstone.board_back.service.TmapService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class TmapServiceImplement implements TmapService {

  @Value("${tmap.app-key}")
  private String tmapAppKey;

  private final RestTemplate restTemplate = new RestTemplate();

  @Override
  public GetRouteTimeResponseDto getRouteTime(RouteTimeRequestDto dto) {

    String url = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

    HttpHeaders headers = new HttpHeaders();
    headers.set("Accept", "application/json");
    headers.set("appKey", tmapAppKey);
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, Object> body = new HashMap<>();
    body.put("startX", dto.getStartLng());
    body.put("startY", dto.getStartLat());
    body.put("endX", dto.getEndLng());
    body.put("endY", dto.getEndLat());
    body.put("reqCoordType", "WGS84GEO");
    body.put("resCoordType", "WGS84GEO");
    body.put("startName", "출발지");
    body.put("endName", "도착지");

    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

    ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
    Map<String, Object> respBody = response.getBody();

    // features[0].properties.totalTime, totalDistance 를 꺼낸다는 가정
    List<Map<String, Object>> features = (List<Map<String, Object>>) respBody.get("features");
    Map<String, Object> firstFeature = features.get(0);
    Map<String, Object> properties = (Map<String, Object>) firstFeature.get("properties");

    int totalTimeSeconds = (int) properties.get("totalTime");
    int totalDistanceMeters = (int) properties.get("totalDistance");

    int minutes = (int) Math.round(totalTimeSeconds / 60.0);
    double km = totalDistanceMeters / 1000.0;
    String formatted = String.format("약 %d분 (거리 %.1fkm)", minutes, km);

    return GetRouteTimeResponseDto.success(
        totalTimeSeconds, totalDistanceMeters, minutes, formatted);
  }
}
