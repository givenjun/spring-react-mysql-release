package com.capstone.board_back.controller;

import com.capstone.board_back.service.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dev/email")
@RequiredArgsConstructor
public class DevMailController {

    private final MailService mailService;

    /** POST /api/dev/email/ping  { "to":"받는주소" } */
    @PostMapping("/ping")
    public void ping(@RequestBody Map<String, String> body) {
        String to = body.get("to");
        mailService.sendText(to, "[RoutePick] 메일 송신 테스트", "메일 발송 설정이 정상입니다 👋");
    }
}
