package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;

public class UploadBadWordResponseDto extends ResponseDto {
    public UploadBadWordResponseDto() {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
    }
}
