package com.capstone.board_back.entity.primaryKey;

import jakarta.persistence.Column;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class FavoritePk implements Serializable {
    @Column(name="user_email")
    private String userEmail;
    @Column(name="board_number")
    private int boardNumber;
}
