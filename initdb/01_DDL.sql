USE board;

CREATE TABLE board
(
    board_number   INT         NOT NULL AUTO_INCREMENT COMMENT '게시물 번호',
    title          TEXT        NOT NULL COMMENT '게시물 제목',
    content        TEXT        NOT NULL COMMENT '게시물 내용',
    write_datetime DATETIME    NOT NULL COMMENT '게시물 작성 날짜 및 시간',
    favorite_count INT         NOT NULL DEFAULT 0 COMMENT '게시물 좋아요 수',
    comment_count  INT         NOT NULL DEFAULT 0 COMMENT '게시물 댓글 수',
    view_count     INT         NOT NULL DEFAULT 0 COMMENT '게시물 조회 수',
    writer_email   VARCHAR(50) NOT NULL COMMENT '게시물 작성자 이메일',
    PRIMARY KEY (board_number)
) COMMENT '게시물 테이블';

CREATE TABLE comment
(
    comment_number INT         NOT NULL AUTO_INCREMENT COMMENT '댓글 번호',
    content        TEXT        NOT NULL COMMENT '댓글내용',
    write_datetime DATETIME    NOT NULL COMMENT '작성 날짜 및 시간',
    user_email     VARCHAR(50) NOT NULL COMMENT '사용자 이메일',
    board_number   INT         NOT NULL COMMENT '게시물 번호',
    PRIMARY KEY (comment_number)
) COMMENT '댓글 테이블';

CREATE TABLE favorite
(
    user_email   VARCHAR(50) NOT NULL COMMENT '사용자 이메일',
    board_number INT         NOT NULL COMMENT '게시물 번호',
    PRIMARY KEY (user_email, board_number)
) COMMENT '좋아요 테이블';

CREATE TABLE image
(
    board_number INT  NOT NULL COMMENT '게시물 번호',
    image        TEXT NOT NULL COMMENT '게시물 이미지 URL'
) COMMENT '게시물 이미지 테이블';

CREATE TABLE search_log
(
    sequence      INT     NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
    search_word   TEXT    NOT NULL COMMENT '검색',
    relation_word TEXT    NULL     COMMENT '관련 검색어',
    relation      BOOLEAN NOT NULL COMMENT '관련 검색어 여부',
    PRIMARY KEY (sequence)
) COMMENT '검색 기록 테이블';

CREATE TABLE user
(
    email          VARCHAR(50)  NOT NULL COMMENT '사용자 이메일',
    password       VARCHAR(100) NOT NULL COMMENT '사용자 비밀번호',
    nickname       VARCHAR(20)  NOT NULL COMMENT '사용자 닉네임',
    tel_number     VARCHAR(15)  NOT NULL COMMENT '사용자 휴대전화번호',
    address        TEXT         NOT NULL COMMENT '사용자 주소',
    address_detail TEXT         NULL     COMMENT '사용자 상세 주소',
    profile_image  TEXT         NULL     COMMENT '사용자 프로필 사진 URL',
    PRIMARY KEY (email)
) COMMENT '사용자 테이블';

ALTER TABLE user
    ADD CONSTRAINT UQ_nickname UNIQUE (nickname);

ALTER TABLE user
    ADD CONSTRAINT UQ_tel_number UNIQUE (tel_number);

ALTER TABLE user ADD COLUMN agreed_personal TINYINT(1) DEFAULT 0;

ALTER TABLE image
    ADD CONSTRAINT FK_board_TO_image
        FOREIGN KEY (board_number)
            REFERENCES board (board_number);

ALTER TABLE board
    ADD CONSTRAINT FK_user_TO_board
        FOREIGN KEY (writer_email)
            REFERENCES user (email);

ALTER TABLE comment
    ADD CONSTRAINT FK_user_TO_comment
        FOREIGN KEY (user_email)
            REFERENCES user (email);

ALTER TABLE comment
    ADD CONSTRAINT FK_board_TO_comment
        FOREIGN KEY (board_number)
            REFERENCES board (board_number);

ALTER TABLE favorite
    ADD CONSTRAINT FK_user_TO_favorite
        FOREIGN KEY (user_email)
            REFERENCES user (email);

ALTER TABLE favorite
    ADD CONSTRAINT FK_board_TO_favorite
        FOREIGN KEY (board_number)
            REFERENCES board (board_number);

CREATE USER 'developer'@'*' identified by 'P!ssw0rd';

CREATE VIEW board_list_view AS
SELECT B.board_number   AS board_number,
       B.title          AS title,
       B.content        AS content,
       I.image          AS title_image,
       B.favorite_count AS favorite_count,
       B.comment_count  AS comment_count,
       B.view_count     AS view_count,
       B.write_datetime AS write_datetime,
       B.writer_email   AS writer_email,
       U.nickname       AS writer_nickname,
       U.profile_image  AS writer_profile_image
FROM board AS B
         INNER JOIN user AS U
                    ON B.writer_email = U.email
         LEFT JOIN (SELECT board_number, ANY_VALUE(image) AS image FROM image GROUP BY board_number) AS I
                   ON B.board_number = I.board_number;


alter table image add sequence int primary key auto_increment comment '이미지 번호';

-- 2학기 이후
ALTER TABLE user
    ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0,
    ADD INDEX idx_user_email_verified (email_verified);

-- 1) 이메일 인증 토큰 테이블 (유지보수/보안 고려: 토큰 원문은 저장하지 않고 해시만 저장)
CREATE TABLE IF NOT EXISTS email_verification_token (
                                                        id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '토큰 PK',
                                                        user_email   VARCHAR(50)  NOT NULL COMMENT '대상 사용자 이메일 (user.email FK)',
                                                        token_hash   CHAR(64)     NOT NULL COMMENT '원문 토큰의 SHA-256 해시',
                                                        expires_at   DATETIME     NOT NULL COMMENT '만료 시각',
                                                        used_at      DATETIME         NULL COMMENT '사용 완료 시각',
                                                        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 시각',
                                                        PRIMARY KEY (id),
                                                        CONSTRAINT FK_evt_user
                                                            FOREIGN KEY (user_email) REFERENCES user (email) ON DELETE CASCADE,
                                                        UNIQUE KEY uk_evt_token_hash (token_hash),
                                                        KEY idx_evt_user_expires (user_email, expires_at)
) COMMENT='이메일 인증 토큰';

-- (선택) 재전송 쿨다운 체크용 뷰: 최근 발급 시각
CREATE OR REPLACE VIEW v_latest_email_token AS
SELECT
    user_email,
    MAX(created_at) AS last_issued_at
FROM email_verification_token
GROUP BY user_email;