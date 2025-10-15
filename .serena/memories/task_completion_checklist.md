# 작업 완료 시 수행할 작업

## 코드 품질 검사
1. **ESLint 실행**
   ```powershell
   pnpm run lint
   ```
   - 모든 ESLint 오류/경고 해결
   - 코드 스타일 일관성 확인

2. **TypeScript 컴파일 검사**
   - Next.js 빌드 시 자동 검사됨
   - 타입 오류 해결 필수

## 데이터베이스 관련
3. **Prisma 스키마 변경 시**
   ```powershell
   pnpm run db:push      # 개발용
   pnpm run db:migrate   # 프로덕션용
   pnpm run db:generate  # 클라이언트 재생성
   ```

## 기능 테스트
4. **수동 테스트**
   - 개발 서버 실행: `pnpm run dev:strict`
   - 브라우저에서 기능 동작 확인
   - 로그인/로그아웃 테스트
   - 권한별 접근 제어 확인

5. **API 엔드포인트 테스트**
   ```powershell
   curl.exe -sS http://localhost:3051/api/health
   ```

## 빌드 검증
6. **프로덕션 빌드 테스트**
   ```powershell
   pnpm run build
   ```
   - 빌드 오류 없이 완료되는지 확인
   - 번들 크기 최적화 확인

## 문서화 업데이트
7. **README.md 업데이트**
   - 새로운 기능 설명 추가
   - 명령어 가이드 업데이트

8. **컴포넌트 문서화**
   - PropTypes/Interface 문서화
   - 사용 예시 주석 추가

## 버전 관리
9. **Git 커밋**
   - 의미있는 커밋 메시지
   - 변경사항 단위별로 커밋
   - 브랜치 전략 준수