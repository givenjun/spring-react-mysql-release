package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class GetBadWordListResponseDto extends ResponseDto {

    private List<String> strict;
    private List<String> loose;
    private List<String> regex;

    public GetBadWordListResponseDto(List<String> strict, List<String> loose, List<String> regex) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.strict = strict;
        this.loose = loose;
        this.regex = regex;
    }
}
