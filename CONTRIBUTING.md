# CONTRIBUTING.md

## 개발 환경 세팅
1. Node.js LTS, pnpm 설치
2. `pnpm install`로 의존성 설치
3. `.env.local` 환경 변수 파일 작성 (예시: DB, 인증 정보)
4. 개발 서버 실행: `pnpm dev`

## 브랜치 전략
- `main`: 배포/운영 브랜치
- `dev`: 개발 통합 브랜치
- 기능/버그: `feature/`, `fix/` 접두어 사용

## 커밋 메시지 규칙
- Conventional Commits 사용 (예: `feat:`, `fix:`, `docs:`)
- 커밋 메시지 예시: `feat: 프로젝트 생성 API 추가`

## PR 및 코드 리뷰
- PR은 `dev` 브랜치로 요청
- PR 템플릿 준수, 관련 이슈 연결
- 코드 리뷰 후 병합

## 코드 스타일
- TypeScript, ESLint, Prettier 적용
- 일관된 import 순서, 함수/컴포넌트 네이밍

## 테스트
- 단위/통합: Vitest, MSW
- E2E: Playwright
- `pnpm run test`로 전체 테스트 실행

## 기타
- 주요 변경 사항은 ARCHITECTURE.md, API_DESIGN.md에 문서화
- 보안/환경 변수는 `.env.local`로 관리

---
기여해주셔서 감사합니다!