package com.capstone.board_back.repository;

import com.capstone.board_back.entity.BoardListViewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardListViewRepository extends JpaRepository<BoardListViewEntity, Integer> {

    List<BoardListViewEntity> findByOrderByWriteDatetimeDesc();
    List<BoardListViewEntity> findTop3ByWriteDatetimeGreaterThanOrderByFavoriteCountDescCommentCountDescViewCountDescWriteDatetimeDesc(String writeDatetime);
    List<BoardListViewEntity> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByWriteDatetimeDesc(String title, String content);
    List<BoardListViewEntity> findByWriterEmailOrderByWriteDatetimeDesc(String writerEmail);



}
