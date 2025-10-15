# 코드 스타일 및 컨벤션

## TypeScript 설정
- **Target**: ES6 
- **Strict mode**: 활성화
- **Module resolution**: bundler
- **JSX**: preserve (Next.js)

## 네이밍 컨벤션
- **Components**: PascalCase (예: `UserProfile`, `TopNav`)
- **Functions**: camelCase (예: `handleSubmit`, `getUserData`)
- **Files**: kebab-case for pages, PascalCase for components
- **Constants**: UPPER_SNAKE_CASE (예: `API_BASE_URL`)

## 파일 구조
```
app/                 # Next.js App Router
├── api/             # API routes
├── auth/           # 인증 관련 페이지
├── dashboard/      # 대시보드 페이지
components/         # 재사용 가능한 컴포넌트
├── ui/             # 기본 UI 컴포넌트 (shadcn)
├── kokonutui/      # 대시보드 특화 컴포넌트
hooks/              # Custom React hooks
lib/                # 유틸리티 함수들
prisma/             # 데이터베이스 스키마 및 시드
types/              # TypeScript 타입 정의
```

## React 컨벤션
- **"use client"** 지시어 사용 (클라이언트 컴포넌트)
- **Props interface** 명명: `ComponentNameProps`
- **Default exports** 사용
- **Functional components** 선호
- **Custom hooks** prefix: `use`

## CSS/Styling
- **Tailwind CSS** 우선 사용
- **CSS Variables** for theming
- **className** 조건부 렌더링에 `clsx` 사용
- **Responsive design**: mobile-first approach

## 데이터베이스
- **Prisma** 스키마 사용
- **camelCase** for fields
- **PascalCase** for models
- **Enums** 대문자 스네이크 케이스