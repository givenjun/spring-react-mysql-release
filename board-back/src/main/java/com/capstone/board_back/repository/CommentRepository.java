package com.capstone.board_back.repository;

import com.capstone.board_back.entity.CommentEntity;
import com.capstone.board_back.repository.resultSet.GetCommentListResultSet;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Integer> {

    @Query(
            value =
                "SELECT " +
                "    C.comment_number AS commentNumber, " +   // ✨ 댓글 번호 추가
                "    C.user_email AS userEmail, " +         // ✨ 댓글 작성자 이메일 추가
                "U.nickname AS nickname, " +
                "U.profile_image AS profileImage, " +
                "C.write_datetime AS writeDatetime, " +
                "C.content AS content " +
                "FROM comment AS C " +
                "INNER JOIN user AS U " +
                "ON C.user_email = U.email " +
                "WHERE C.board_number = ?1 " +
                "ORDER BY writeDatetime DESC; ",
                nativeQuery = true

    )
    List<GetCommentListResultSet> getCommentList(Integer boardNumber);

    @Transactional
    void deleteByBoardNumber(Integer boardNumber);

}
