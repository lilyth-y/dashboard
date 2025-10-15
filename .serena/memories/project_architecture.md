# 프로젝트 아키텍처

## 디렉토리 구조
```
dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # NextAuth.js endpoints
│   │   └── health/        # Health check
│   ├── auth/              # 인증 페이지
│   │   ├── signin/        # 로그인
│   │   └── signup/        # 회원가입
│   ├── dashboard/         # 메인 대시보드
│   │   ├── analytics/     # 분석 페이지
│   │   ├── finance/       # 재무 관리
│   │   ├── organization/  # 조직 관리
│   │   └── projects/      # 프로젝트 관리
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지 (→ /dashboard 리디렉트)
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── kokonutui/        # 대시보드 특화 컴포넌트
│   ├── auth-provider.tsx  # NextAuth 프로바이더
│   └── theme-provider.tsx # 다크모드 프로바이더
├── hooks/                # Custom React Hooks
├── lib/                  # 유틸리티 및 설정
│   ├── auth.ts           # NextAuth 설정
│   ├── prisma.ts         # Prisma 클라이언트
│   └── utils.ts          # 공통 유틸리티
├── prisma/               # 데이터베이스
│   ├── schema.prisma     # 데이터베이스 스키마
│   ├── seed.ts           # 시드 데이터
│   └── dev.db            # SQLite 데이터베이스 파일
├── types/                # TypeScript 타입 정의
└── middleware.ts         # Next.js 미들웨어 (인증 체크)
```

## 주요 컴포넌트 관계
- **Layout**: `app/layout.tsx` → AuthProvider → ThemeProvider
- **Dashboard**: `components/kokonutui/layout.tsx` → Sidebar + TopNav + Content
- **Authentication**: NextAuth.js + Prisma Adapter + SQLite
- **Routing**: App Router + middleware.ts for auth protection

## 데이터 플로우
1. **Authentication**: NextAuth → Prisma → SQLite
2. **Dashboard**: React Components → Custom Hooks → Prisma Client → Database
3. **Theming**: next-themes → CSS Variables → Tailwind Classes