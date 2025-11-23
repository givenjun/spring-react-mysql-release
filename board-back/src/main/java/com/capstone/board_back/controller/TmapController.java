package com.capstone.board_back.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/tmap")
public class TmapController {

  @Value("${tmap.app-key}")
  private String appKey;

  private final RestTemplate rest = new RestTemplate();

  /**
   * 요청 바디 예시: { "start": {"lat": 37.5665, "lng": 126.9780}, "end": {"lat": 37.5700, "lng":
   * 126.9820}, "viaPoints": [ {"lat": 37.5680, "lng": 126.9800} ] // 선택 }
   */
  @PostMapping("/pedestrian")
  public ResponseEntity<String> pedestrian(@RequestBody PedestrianReq body) {

    // === 1) Payload 구성 (Tmap 보행자 API 형식)
    Map<String, String> payload = new HashMap<>();
    payload.put("startX", String.valueOf(body.getStart().getLng())); // X = lng
    payload.put("startY", String.valueOf(body.getStart().getLat())); // Y = lat
    payload.put("endX", String.valueOf(body.getEnd().getLng()));
    payload.put("endY", String.valueOf(body.getEnd().getLat()));
    payload.put("reqCoordType", "WGS84GEO");
    payload.put("resCoordType", "WGS84GEO");
    payload.put("startName", "출발지");
    payload.put("endName", "도착지");
    // 필요 시 탐색 옵션을 추가하고 싶다면 (문서 기준):
    // payload.put("searchOption", "0");

    // === 1-1) viaPoints -> passList (lng,lat_lng,lat_...)
    if (body.getViaPoints() != null && !body.getViaPoints().isEmpty()) {
      String passList =
          body.getViaPoints().stream()
              .limit(5) // 보행자 API 경유지 권장 최대치
              .map(p -> p.getLng() + "," + p.getLat())
              .collect(Collectors.joining("_"));
      payload.put("passList", passList);
    }

    // === 2) Header (appKey 안전 보정)
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
    String safeKey = appKey != null ? appKey.replace("\"", "") : "";
    headers.set("appKey", safeKey);

    HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
    String url = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json";

    try {
      ResponseEntity<String> resp = rest.postForEntity(url, entity, String.class);
      return ResponseEntity.status(resp.getStatusCode()).body(resp.getBody());
    } catch (HttpStatusCodeException e) {
      // Tmap 에러 그대로 전달(디버깅 편의)
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
    }
  }

  // ✅ 여기서부터 추가: 경로 시간만 추려서 반환하는 API
  @PostMapping("/route-time")
  public ResponseEntity<Map<String, Object>> getRouteTime(@RequestBody PedestrianReq body) {

    // 1) 위와 동일한 payload 구성
    Map<String, String> payload = new HashMap<>();
    payload.put("startX", String.valueOf(body.getStart().getLng()));
    payload.put("startY", String.valueOf(body.getStart().getLat()));
    payload.put("endX", String.valueOf(body.getEnd().getLng()));
    payload.put("endY", String.valueOf(body.getEnd().getLat()));
    payload.put("reqCoordType", "WGS84GEO");
    payload.put("resCoordType", "WGS84GEO");
    payload.put("startName", "출발지");
    payload.put("endName", "도착지");

    if (body.getViaPoints() != null && !body.getViaPoints().isEmpty()) {
      String passList =
          body.getViaPoints().stream()
              .limit(5)
              .map(p -> p.getLng() + "," + p.getLat())
              .collect(Collectors.joining("_"));
      payload.put("passList", passList);
    }

    // 2) Header
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
    String safeKey = appKey != null ? appKey.replace("\"", "") : "";
    headers.set("appKey", safeKey);

    HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
    String url = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json";

    try {
      // 🔍 이번엔 String이 아니라 Map으로 바로 받음 (JSON 파싱용)
      ResponseEntity<Map> resp = rest.postForEntity(url, entity, Map.class);
      Map<String, Object> respBody = resp.getBody();

      Map<String, Object> result = new HashMap<>();

      if (respBody == null || !respBody.containsKey("features")) {
        result.put("success", false);
        result.put("message", "Tmap 응답에 features 필드가 없습니다.");
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
      }

      List<Map<String, Object>> features = (List<Map<String, Object>>) respBody.get("features");
      if (features == null || features.isEmpty()) {
        result.put("success", false);
        result.put("message", "Tmap 응답 features가 비어 있습니다.");
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
      }

      Map<String, Object> firstFeature = features.get(0);
      Map<String, Object> properties = (Map<String, Object>) firstFeature.get("properties");

      Number totalTime = (Number) properties.get("totalTime");
      Number totalDistance = (Number) properties.get("totalDistance");

      int totalTimeSeconds = (totalTime != null) ? totalTime.intValue() : 0;
      int totalDistanceMeters = (totalDistance != null) ? totalDistance.intValue() : 0;

      int minutes = (int) Math.round(totalTimeSeconds / 60.0);
      double km = totalDistanceMeters / 1000.0;

      result.put("success", true);
      result.put("totalTimeSeconds", totalTimeSeconds);
      result.put("totalDistanceMeters", totalDistanceMeters);
      result.put("durationMinutes", minutes);
      result.put("formatted", String.format("약 %d분 (거리 %.1fkm)", minutes, km));

      return ResponseEntity.ok(result);

    } catch (HttpStatusCodeException e) {
      Map<String, Object> error = new HashMap<>();
      error.put("success", false);
      error.put("status", e.getStatusCode().value());
      error.put("body", e.getResponseBodyAsString());
      return ResponseEntity.status(e.getStatusCode()).body(error);
    }
  }

  @GetMapping("/_debugKey")
  public Map<String, String> debugKey() {
    Map<String, String> m = new HashMap<>();
    String v = appKey;
    String masked =
        (v == null || v.isBlank())
            ? "null/blank"
            : (v.length() <= 8 ? v : v.substring(0, 4) + "****" + v.substring(v.length() - 4));
    m.put("hasKey", String.valueOf(v != null && !v.isBlank()));
    m.put("preview", masked);
    return m;
  }

  @GetMapping("/ping")
  public String ping() {
    return "tmap-ok";
  }

  // ====== 요청 DTO ======
  public static class PedestrianReq {
    private LatLng start;
    private LatLng end;
    private List<LatLng> viaPoints; // ← 추가

    public LatLng getStart() {
      return start;
    }

    public void setStart(LatLng start) {
      this.start = start;
    }

    public LatLng getEnd() {
      return end;
    }

    public void setEnd(LatLng end) {
      this.end = end;
    }

    public List<LatLng> getViaPoints() {
      return viaPoints;
    }

    public void setViaPoints(List<LatLng> viaPoints) {
      this.viaPoints = viaPoints;
    }
  }

  public static class LatLng {
    private double lat;
    private double lng;

    public double getLat() {
      return lat;
    }

    public void setLat(double lat) {
      this.lat = lat;
    }

    public double getLng() {
      return lng;
    }

    public void setLng(double lng) {
      this.lng = lng;
    }
  }
}
