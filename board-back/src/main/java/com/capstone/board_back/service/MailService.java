package com.capstone.board_back.service;

public interface MailService {
    void sendVerifyEmail(String email, String token);
}
