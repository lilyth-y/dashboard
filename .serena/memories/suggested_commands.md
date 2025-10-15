# Dashboard 개발 명령어

## 개발 서버 실행
```powershell
# 기본 개발 서버 (포트 3051 고정)
pnpm run dev:strict

# 일반 개발 서버
pnpm run dev

# 고정 포트로 실행
pnpm run dev:fixed

# 커스텀 포트
$env:PORT=3000; pnpm run dev:strict
```

## 데이터베이스 관리
```powershell
# Prisma 클라이언트 생성
pnpm run db:generate

# 스키마를 데이터베이스에 적용
pnpm run db:push

# 마이그레이션 생성/실행
pnpm run db:migrate

# 데이터베이스 GUI 도구
pnpm run db:studio

# 시드 데이터 생성
pnpm run db:seed
```

## 빌드 및 배포
```powershell
# 프로덕션 빌드
pnpm run build

# 프로덕션 실행
pnpm run start
```

## 코드 품질
```powershell
# ESLint 실행
pnpm run lint

# 패키지 설치
pnpm install

# 패키지 추가
pnpm add <package-name>
pnpm add -D <dev-package>
```

## 시스템 유틸리티 (Windows)
```powershell
# 포트 확인
netstat -ano | findstr :3051

# 프로세스 종료
Stop-Process -Id <PID> -Force
taskkill /f /im node.exe

# API 상태 확인
curl.exe -sS http://localhost:3051/api/health

# 디렉토리 탐색
ls, dir, Get-ChildItem
cd <path>
```

## 테스트 계정
- **관리자**: admin@example.com / admin123!
- **일반사용자**: user@example.com / user123!