package com.capstone.board_back.dto.response.board;

import com.capstone.board_back.common.ResponseCode;
import com.capstone.board_back.common.ResponseMessage;
import com.capstone.board_back.common.util.BadWordFilterProvider;
import com.capstone.board_back.dto.object.FavoriteListItem;
import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.repository.resultSet.GetFavoriteListResultSet;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetFavoriteListResponseDto extends ResponseDto {

    private List<FavoriteListItem> favoriteList;

    private GetFavoriteListResponseDto(List<GetFavoriteListResultSet> resultSets,
                                       BadWordFilterProvider provider) {
        super(ResponseCode.SUCCESS, ResponseMessage.SUCCESS);
        this.favoriteList = FavoriteListItem.copyList(resultSets, provider);
    }

    public static ResponseEntity<GetFavoriteListResponseDto> success(
            List<GetFavoriteListResultSet> resultSets,
            BadWordFilterProvider provider
    ) {
        GetFavoriteListResponseDto body =
                new GetFavoriteListResponseDto(resultSets, provider);

        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    public static ResponseEntity<ResponseDto> notExistBoard() {
        ResponseDto body =
                new ResponseDto(ResponseCode.NOT_EXISTED_BOARD,
                        ResponseMessage.NOT_EXISTED_BOARD);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
