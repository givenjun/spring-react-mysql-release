package com.capstone.board_back.dto.request.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class EmailSendRequestDto {

    @NotBlank
    @Email
    private String email;
}
