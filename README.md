# RoutePick

<div aligns="center">
<img width="329" alt="image" src="board-front\src\assets\image\routepick-logo-icon.png">

</div>

# RoutePick Web Page
> **국립한밭대학교 정보통신공학과 캡스톤디자인** <br/> **개발기간: 2025.03 ~ 2025.12**

## 배포 주소

> **배포 버전** : [https://routepick.net/](https://routepick.net/) <br>

## 웹개발팀 소개

|      정 준       |          임채훈         |       박승훈         |                                                                                                               
| :------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | 
|   <img width="160px" src="https://avatars.githubusercontent.com/u/152844483?s=64&v=4" />    |                      <img width="160px" src="https://avatars.githubusercontent.com/u/97745435?s=64&v=4" />    |                   <img width="160px" src="https://avatars.githubusercontent.com/u/152844617?s=64&v=4"/>   |
|   [@givenjun](https://github.com/givenjun)   |    [@dlao1140](https://github.com/dlao1140)  | [@thaus2](https://github.com/thaus2)  |
| 국립한밭대학교 정보통신공학과 4학년 | 국립한밭대학교 정보통신공학과 4학년 | 국립한밭대학교 정보통신공학과 4학년 |

## 프로젝트 소개

RoutePick은 위치 기반 커뮤니티 웹 서비스로,
사용자가 경로를 기준으로 주변 장소를 탐색하고,
게시판을 통해 지역 커뮤니티 활동을 할 수 있는 웹 플랫폼입니다.

전국 어디서든 접근 가능하며,
지도 기반 장소 검색과 커뮤니티 기능을 결합해 실사용 가능한 로컬 서비스를 목표로 개발되었습니다.

RoutePick의 핵심 기능:
- Kakao 지도 기반 장소 검색 및 마커 표시
- 현재 위치 기반 명소·식당 탐색
- 경로 기반(출발지 → 도착지) 주변 장소 추천
- 로그인/회원가입, 이메일 인증
- 게시판 CRUD(공지사항 포함)
- 관리자 페이지(유저 관리 · 게시판 관리)

## 시작 가이드
### Requirements
For building and running the application you need:

- [Node.js 22.20.0](https://nodejs.org/)
- [Npm 10.9.3](https://www.npmjs.com/)
- [Java 17](https://www.oracle.com/java/)
- [MySQL 8.0](https://dev.mysql.com/)
- [Docker Compose 2.40.3-desktop.1](https://www.docker.com/)

### Installation
``` bash
$ git clone https://github.com/givenjun/spring-react-mysql-release.git
$ cd spring-react-mysql-release
```
#### Backend (Spring Boot)
##### Local 개발 환경
``` bash
$ cd board-back
$ ./gradlew clean build -x test
$ java -jar build/libs/app.jar
```
##### Local 환경 설정
src/main/resources/application.properties 파일에서 로컬 DB 및 CORS 설정을 관리합니다.
``` bash
$ java -jar -D spring.profiles.active=local build/libs/app.jar
```

#### Frontend (React + TypeScript)
##### Local 개발 환경
``` bash
$ cd board-front
$ npm install
$ npm start
```
React의 API 기본 도메인은 .env.local 파일로 관리됩니다
```
REACT_APP_API_URL=http://localhost:4000
```
#### Docker 기반 실행
##### 도커 로컬 실행
``` bash
$ cd infra
$ docker compose -f docker-compose.local.yml up --build -d
```

##### 도커 프로덕션 실행

(EC2 또는 서버 환경)
``` bash
$ cd infra
$ docker compose -f docker-compose.prod.yml up --build -d
```
---

## Stacks 🐈

## 🔧 Environment
![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ%20IDEA-000000?style=for-the-badge&logo=intellijidea&logoColor=white)
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🖥️ Backend
![Java](https://img.shields.io/badge/Java%2017-007396?style=for-the-badge&logo=oracle&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![JPA](https://img.shields.io/badge/JPA%20%2F%20Hibernate-59666C?style=for-the-badge&logo=hibernate&logoColor=white)
![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)

---

## 🎨 Frontend
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

---

## 🗄️ Database
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

---

## 🚀 DevOps / Infra
![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

---
## 화면 구성 📺
| 지도 페이지  |  게시물 페이지   |
| :-------------------------------------------: | :------------: |
|  <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/> |  <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/>|  
| 공지사항 페이지   |  로그인 페이지   |  
| <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/>   |  <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/>     |
| 마이 페이지   |  어드민 페이지   |  
| <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/>   |  <img width="329" src="board-front\src\assets\image\routepick-logo-icon.png"/>     |

---
## 주요 기능 📦

### ⭐️ 지도 기반 장소 탐색
- Kakao Maps API로 장소 검색
- 검색 결과 장소 리스트 표시
- 장소 클릭 시 InfoWindow

### ⭐️ 경로 기반 주변 장소 추천
- 출발지 → 도착지 입력
- 지정 경로 기반 주변 장소 탐색

### ⭐️ 커뮤니티 기능
- 게시판 CRUD
- 공지사항
- 비속어 필터링(관리자 기능 연동)

### ⭐️ 회원 기능
- 회원가입 / 로그인
- 이메일 인증
- JWT 기반 인증/인가

### ⭐️ 관리자 페이지
- 유저 관리
- 게시판 관리
- 공지사항 관리
- 비속어 필터링 관리

---
## 아키텍쳐

### 디렉토리 구조
```bash
├── README.md
├── package.json
├── package-lock.json
│
├── board-back : Spring Boot 백엔드
│   ├── src
│   │   ├── main
│   │   │   ├── java/com/capstone/board_back
│   │   │   │   ├── config
│   │   │   │   ├── controller
│   │   │   │   ├── dto
│   │   │   │   ├── entity
│   │   │   │   ├── exception
│   │   │   │   ├── filter
│   │   │   │   ├── provider
│   │   │   │   ├── repository
│   │   │   │   └── service
│   │   │   └── resources
│   │   │       ├── application.properties
│   │   │       └── templates/email
│   │   └── test
│   └── build.gradle
│ 
│
└── board-front : React 프론트엔드
    ├── public
    │   ├── index.html
    │   └── routepick-logo-icon.png
    │
    ├── src
    │   ├── assets
    │   ├── components
    │   ├── hooks
    │   ├── views
    │   ├── App.tsx
    │   └── index.tsx
    │
    └── package.json

```