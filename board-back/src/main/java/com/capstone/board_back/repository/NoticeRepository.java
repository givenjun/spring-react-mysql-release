package com.capstone.board_back.repository;

import com.capstone.board_back.entity.NoticeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeRepository extends JpaRepository<NoticeEntity, Long> {
    List<NoticeEntity> findAllByOrderByPinnedDescCreatedAtDesc();
}
