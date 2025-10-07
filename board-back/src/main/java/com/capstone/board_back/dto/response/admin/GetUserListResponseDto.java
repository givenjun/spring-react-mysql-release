package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.entity.UserEntity;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetUserListResponseDto extends ResponseDto {

    private List<UserEntity> userList;

    private GetUserListResponseDto(List<UserEntity> userList) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.userList = userList;
    }

    public static ResponseEntity<GetUserListResponseDto> success(List<UserEntity> userList) {
        GetUserListResponseDto responseBody = new GetUserListResponseDto(userList);
        return ResponseEntity.status(HttpStatus.OK).body(responseBody);
    }
}
