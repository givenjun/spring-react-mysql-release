package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetBadWordListResponseDto extends ResponseDto {

    private List<String> strict;
    private List<String> loose;
    private List<String> regex;

    private GetBadWordListResponseDto(
            String code, String message,
            List<String> strict,
            List<String> loose,
            List<String> regex
    ) {
        super(code, message);
        this.strict = strict;
        this.loose = loose;
        this.regex = regex;
    }

    public static ResponseEntity<GetBadWordListResponseDto> success(
            List<String> strict,
            List<String> loose,
            List<String> regex
    ) {
        GetBadWordListResponseDto responseBody =
                new GetBadWordListResponseDto(
                        ResponseCode.SUCCESS,
                        ResponseMessage.SUCCESS,
                        strict, loose, regex
                );
        return ResponseEntity.status(HttpStatus.OK).body(responseBody);
    }
}
