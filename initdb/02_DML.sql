USE board;

-- 회원가입
INSERT INTO user (email, password, nickname, tel_number, address, address_detail, profile_image)
VALUES ('email@email.com', 'P!ssw0od', 'nickname', '01012345678', '대전광역시 유성구', '한밭대학교', NULL);

-- 로그인
SELECT  * FROM user WHERE email = 'email@email.com';

-- 게시물 작성
INSERT INTO
    board (title, content, write_datetime, favorite_count, comment_count, view_count, writer_email)
VALUES ('제목입니다.', '내용입니다.', '2025-03-23 18:10', 0, 0, 0, 'email@email.com');

INSERT INTO image(board_number, image) VALUES (1, 'url');


-- 댓글 작성
INSERT INTO
    comment (content, write_datetime, user_email, board_number)
VALUES ('반갑습니다.', '2025-03-23 18:14', 'email@email.com', '1');

UPDATE board SET comment_count = comment_count + 1 WHERE board_number = 1;

-- 좋아요
INSERT INTO
    favorite VALUES ('email@email.com', 1);

UPDATE board SET favorite_count = favorite_count + 1 WHERE board_number = 1;

DELETE FROM favorite WHERE user_email = 'email@email.com' AND board_number = 1;

UPDATE board SET favorite_count = favorite_count - 1 WHERE board_number = 1;

-- 게시물 수정
UPDATE board SET title = '수정 제목입니다.', content = '수정 내용입니다.' WHERE board_number = 1;

DELETE FROM image WHERE board_number = 1;

INSERT INTO image(board_number, image) VALUES (1, 'url');

-- 게시물 삭제
DELETE FROM comment WHERE board_number = 1;
DELETE FROM favorite WHERE board_number = 1;
DELETE FROM image WHERE board_number = 1;
DELETE FROM board WHERE board_number = 1;

-- 상세 게시물 불러오가
SELECT
    B.board_number AS boardNumber,
    B.title AS title,
    B.content AS content,
    B.write_datetime AS writeDatetime,
    B.writer_email AS wrterEmail,
    U.nickname AS writerNickname,
    U.profile_image AS pwritePofileImage
FROM board AS B
         INNER JOIN user AS U
                    ON B.writer_email = U.email
WHERE board_number = 3;

SELECT image
FROM image
WHERE board_number = 3;

SELECT
    U.email AS email,
    U.nickname AS nickname,
    U.profile_image AS profileImage
FROM favorite AS F
         INNER JOIN user AS U
                    ON F.user_email = U.email
WHERE F.board_number = 1;

SELECT
    U.nickname AS nickname,
    U.profile_image AS profileImage,
    C.write_datetime AS writeDatetime,
    C.content AS content
FROM comment AS C
         INNER JOIN user AS U
                    ON C.user_email = U.email
WHERE C.board_number = 1
ORDER BY write_datetime DESC;

-- 최신게시물 리스트 불러오기
SELECT *
FROM board_list_view
ORDER BY write_datetime DESC
LIMIT 5, 5;

-- 검색어 리스트 불러오기
SELECT *
FROM board_list_view
WHERE title LIKE '%수정%' OR content LIKE '%수정%'
ORDER BY write_datetime DESC;

-- 주간 상위 3
SELECT *
FROM board_list_view
WHERE write_datetime BETWEEN '2025-03-17 00:00' AND '2025-03-23 23:59'
ORDER BY favorite_count DESC, comment_count DESC, view_count DESC, write_datetime DESC
LIMIT 3;

-- 특정 유저 게시물 리스트 불러오기
SELECT *
FROM board_list_view
WHERE writer_email = 'email@email.com'
ORDER BY write_datetime DESC;

-- 인기 검색어 리스트
SELECT search_word, count(search_word) AS count
FROM search_log
WHERE relation IS FALSE
GROUP BY search_word
ORDER BY count DESC
LIMIT 15;

-- 관련 검색어 리스트
SELECT relation_word, count(relation_word) AS count
FROM search_log
WHERE search_word = '검색어'
GROUP BY relation_word
ORDER BY count DESC
LIMIT 15;

-- 유저 정보 불러오기 / 로그인 유저 정보 불러오기
SELECT *
FROM user
WHERE email = 'email@email.com';

-- 닉네임 수정
UPDATE user SET nickname = '수정 닉네임' WHERE email = 'email@email.com';

-- 프로필 이미지 수정
UPDATE user SET profile_image = 'url2' WHERE email = 'email@email.com';

-- 2학기 이후
-- A. 토큰 발급 (회원가입 직후 또는 "재전송" 클릭 시)
--    - 앱에서 raw_token(UUID 등) 생성 → DB엔 해시만 저장
--    - 필요 시 기존 토큰 삭제(가장 단순)
INSERT INTO email_verification_token (user_email, token_hash, expires_at)
VALUES (
           :email,
           SHA2(:raw_token, 256),
           DATE_ADD(NOW(), INTERVAL 24 HOUR)   -- 만료 24h (운영에서 조정 가능)
       );

-- B. 인증 링크 클릭 시(검증)
-- 1) 유효 토큰 확인
SELECT id, user_email
FROM email_verification_token
WHERE token_hash = SHA2(:raw_token, 256)
  AND used_at IS NULL
  AND expires_at > NOW()
LIMIT 1;

-- 2) 계정 활성화
UPDATE user
SET email_verified = 1
WHERE email = :user_email;

-- 3) 토큰 사용 처리(1회성)
UPDATE email_verification_token
SET used_at = NOW()
WHERE id = :id;

-- C. 만료/사용 토큰 정리(배치, 예: 1일 1회)
DELETE FROM email_verification_token
WHERE used_at IS NOT NULL
   OR expires_at < NOW();

-- ============================================================
-- 로그인/이용 제어 (권장: "이메일 미인증"은 로그인 자체 차단)
-- ============================================================

-- 로그인 SELECT 예시(실제는 비밀번호 해시 비교)
-- 미인증은 로그인 실패 처리 → 프론트에 "이메일 인증 필요" 안내
SELECT email, password /* + 기타 컬럼 */
FROM user
WHERE email = :email
  AND password = :password_hash
  AND email_verified = 1;