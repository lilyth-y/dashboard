# Dashboard 프로젝트 개요

## 프로젝트 목적
- **비즈니스 대시보드**: 재무 관리, 분석, 프로젝트 관리를 위한 종합 대시보드
- **실제 프로덕션 사용**: 개인/소규모 팀용 비즈니스 관리 도구
- **주요 기능**:
  - 사용자 인증 (이메일/비밀번호 + Google OAuth)
  - 역할 기반 접근 제어 (관리자/일반사용자)
  - 재무 데이터 관리 (매출, 지출, 예산, 현금흐름)
  - 분석 지표 및 KPI 추적
  - 프로젝트 관리 (태스크, 마일스톤)

## 기술 스택
- **Frontend**: Next.js 15.2.4, React 19, TypeScript 5
- **Styling**: Tailwind CSS 3.4, Radix UI, shadcn/ui components
- **Authentication**: NextAuth.js 4.24.11
- **Database**: Prisma ORM + SQLite (개발용)
- **Charts**: Recharts 2.15.0
- **Build Tools**: pnpm, ESLint 9.37.0
- **Theme**: next-themes (다크/라이트 모드)

## 현재 상태
- ✅ 인증 시스템 완료 (로그인/회원가입/권한관리)
- ✅ 데이터베이스 스키마 및 시드 데이터 생성 완료
- ✅ 기본 대시보드 UI 및 네비게이션 구현
- 🔄 다음 단계: 실제 데이터 입력/표시 기능 구현