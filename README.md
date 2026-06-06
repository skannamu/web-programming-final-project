# FocusGuard

FocusGuard는 웹 기반 집중 행동 기록 플랫폼입니다.

사용자는 집중 세션을 시작하고, 웹 페이지에서 발생하는 키 입력, 클릭, 페이지 이탈 횟수, 집중 시간, 메모를 기록할 수 있습니다. 기록된 데이터는 PostgreSQL DB에 저장되며, 대시보드에서 전체 세션 수, 총 집중 시간, 평균 집중 점수 등을 확인할 수 있습니다.

## 주요 기능

- 집중 세션 시작/종료
- 키 입력 횟수 기록
- 마우스 클릭 횟수 기록
- 페이지 이탈 횟수 기록
- 집중 점수 계산
- localStorage를 활용한 진행 중 세션 임시 저장
- PostgreSQL DB 저장
- 세션 기록 조회 및 삭제
- 통계 대시보드 제공

## 기술 스택

### Frontend
- React
- Vite
- localStorage

### Backend
- Node.js
- Express
- PostgreSQL

### Deployment / Infra
- Docker
- Docker Compose
- Nginx Reverse Proxy
- Render
- Vercel
- GitHub Actions

## 배포 링크

Frontend:
https://web-programming-final-project-tau.vercel.app

Backend:
https://focusguard-backend.onrender.com

## API

### Health Check
GET /api/health

### DB Initialize
GET /api/init-db

### Session List
GET /api/sessions

### Create Session
POST /api/sessions

### Delete Session
DELETE /api/sessions/:id

### Statistics
GET /api/stats

## 과제 조건 반영

- GitHub Actions CI workflow 구성
- Dockerfile 및 docker-compose.yml 작성
- Nginx reverse proxy 구성
- Web Storage(localStorage) 활용
- PostgreSQL DBMS 활용
- Render를 통한 backend 배포
- Vercel을 통한 frontend 배포
