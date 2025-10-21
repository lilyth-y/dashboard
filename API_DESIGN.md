# API_DESIGN.md

## API 설계 원칙
- RESTful 엔드포인트 구조
- 모든 에러 응답은 `{ code, message }` 형태로 반환
- 인증 필요 API는 NextAuth 기반 세션 체크

## 표준 에러 응답
```json
{
  "code": "INVALID_INPUT",
  "message": "입력값이 올바르지 않습니다."
}
```
- code: 에러 코드 (예: INVALID_INPUT, NOT_FOUND, UNAUTHORIZED)
- message: 사용자/개발자용 설명

## 주요 엔드포인트 예시
- `POST /api/projects` : 프로젝트 생성
- `GET /api/projects/:id` : 프로젝트 상세 조회
- `POST /api/tasks` : 작업 생성
- `GET /api/user` : 사용자 정보 조회

## 인증/권한 처리
- 모든 민감 API는 세션 체크 후 처리
- 권한 부족 시 `{ code: "FORBIDDEN", message: "권한이 없습니다." }` 반환

## 기타
- 모든 API는 TypeScript 기반 타입 검증
- 에러 발생 시 ApiError throw, catch 후 표준 응답 반환

---
자세한 구조와 예시는 각 API route 파일 참고.