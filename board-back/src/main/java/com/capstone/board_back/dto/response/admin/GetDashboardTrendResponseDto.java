package com.capstone.board_back.dto.response.admin;

import com.capstone.board_back.dto.response.ResponseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Getter
public class GetDashboardTrendResponseDto extends ResponseDto {

    private List<TrendData> trendList;

    @Getter
    @AllArgsConstructor
    public static class TrendData {
        private String date;
        private int newUsers;
        private int newPosts;
    }

    // ✅ ResponseDto(code, message)를 호출하는 생성자 직접 정의
    private GetDashboardTrendResponseDto(String code, String message, List<TrendData> trendList) {
        super(code, message);
        this.trendList = trendList;
    }

    // ✅ 정적 팩토리 메서드
    public static ResponseEntity<GetDashboardTrendResponseDto> success(List<TrendData> trendList) {
        GetDashboardTrendResponseDto response =
                new GetDashboardTrendResponseDto("SU", "Success", trendList);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
