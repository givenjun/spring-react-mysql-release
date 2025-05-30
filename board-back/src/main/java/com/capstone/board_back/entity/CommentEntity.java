package com.capstone.board_back.entity;

import com.capstone.board_back.dto.request.board.PostCommentRequestDto;
import com.capstone.board_back.dto.response.board.PostCommentResponseDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.Date;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity(name="comment")
@Table(name="comment")
public class CommentEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int commentNumber;
    private String content;
    private String writeDatetime;
    private String userEmail;
    private int boardNumber;

    public CommentEntity(PostCommentRequestDto dto, Integer boardNumber, String email) {

        Date now = Date.from(Instant.now());
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String writeDatetime = simpleDateFormat.format(now);

        this.content = dto.getContent();
        this.writeDatetime = writeDatetime;
        this.userEmail = email;
        this.boardNumber = boardNumber;
    }

}
