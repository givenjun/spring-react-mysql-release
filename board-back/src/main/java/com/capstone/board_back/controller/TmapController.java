package com.capstone.board_back.controller;

import java.util.HashMap;
import java.util.Map;
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

  // 요청 바디: {"start":{"lat":..,"lng":..},"end":{"lat":..,"lng":..}}
  @PostMapping("/pedestrian")
  public ResponseEntity<String> pedestrian(@RequestBody PedestrianReq body) {

    // ✅ Tmap이 잘 받는 "문자열" 형태로 전송 (X=lng, Y=lat)
    Map<String, String> payload = new HashMap<>();
    payload.put("startX", String.valueOf(body.getStart().getLng()));
    payload.put("startY", String.valueOf(body.getStart().getLat()));
    payload.put("endX", String.valueOf(body.getEnd().getLng()));
    payload.put("endY", String.valueOf(body.getEnd().getLat()));
    payload.put("reqCoordType", "WGS84GEO");
    payload.put("resCoordType", "WGS84GEO");
    payload.put("startName", "출발지");
    payload.put("endName", "도착지");
    // 필요시 정렬 옵션: payload.put("sort", "index");

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
    headers.set("appKey", appKey);

    HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
    String url = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json";

    try {
      ResponseEntity<String> resp = rest.postForEntity(url, entity, String.class);
      return ResponseEntity.status(resp.getStatusCode()).body(resp.getBody());
    } catch (HttpStatusCodeException e) {
      // ✅ Tmap의 에러 상태/본문 그대로 전달해서 원인 파악 쉽게
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
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
