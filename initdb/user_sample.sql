INSERT INTO `user` (
    email, password, nickname, tel_number, address, address_detail,
    profile_image, agreed_personal, email_verified, role,
    is_deleted, deleted_at, joined_at
)
VALUES
-- 1. 관리자 계정

-- 2. 일반 사용자 1
('jun@routepick.kr',
 '$2a$10$UHDHpdMLuBz/HXmkL8Ge5OYf8kz6rM4hquBYL4fRjOkaGXnSlOoeO', -- 'jun1234'
 '정준',
 '01022223333',
 '대전광역시 유성구 대학로 291',
 '한밭대학교 공대 3호관 401호',
 'https://i.pravatar.cc/150?img=2',
 1, 1, 'USER',
 0, NULL, '2025-09-12 09:40:00'),

-- 3. 일반 사용자 2
('seunghoon@routepick.kr',
 '$2a$10$wSg4HzYyqL5k4YPLyA24duq4q6jF6k7eYdzZbR6jvZP6k3e.TvO8O', -- 'sh1234'
 '승훈',
 '01044445555',
 '서울특별시 마포구 독막로 211',
 '201호',
 'https://i.pravatar.cc/150?img=3',
 1, 0, 'USER',
 0, NULL, '2025-09-15 15:12:00'),

-- 4. 일반 사용자 3
('chaehoon@routepick.kr',
 '$2a$10$6CJW8HClAkgulI1gqM8cCObm0J8VspDyzSWsQmqS7o4SO4bE5h07u', -- 'ch1234'
 '채훈',
 '01066667777',
 '부산광역시 해운대구 우동 123-45',
 '305호',
 'https://i.pravatar.cc/150?img=4',
 1, 1, 'USER',
 0, NULL, '2025-09-20 20:22:00'),

-- 5. 일반 사용자 4 (탈퇴 유저)
('testuser@routepick.kr',
 '$2a$10$9cIz8TzTPVn3qpsFSTWCOuF1hA6uZ.GmZL5MCbACxFX4vq96iyB0S', -- 'test1234'
 '테스터',
 '01088889999',
 '인천광역시 연수구 송도동 77',
 '102동 803호',
 'https://i.pravatar.cc/150?img=5',
 1, 1, 'USER',
 1, '2025-10-01 09:10:00', '2025-09-22 10:00:00'),

-- 6. 일반 사용자 5
('minyoung@routepick.kr',
 '$2a$10$E/NkhM3ZyZC6idgVx4A5eujqXkJcCHoMJzvDWGAv/zexAJ5kMKkQ6', -- 'my1234'
 '민영',
 '01055556666',
 '경기도 수원시 영통구 대학로 50',
 '영통빌리지 202호',
 'https://i.pravatar.cc/150?img=6',
 1, 1, 'USER',
 0, NULL, '2025-09-25 18:35:00');
