# ARCHITECTURE.md

## Overview
This project is a modern web dashboard built with Next.js, TypeScript, Prisma, and Tailwind CSS. It provides authenticated access to project, task, milestone, financial, and user management features.

## Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM
- **Database:** (Configured via Prisma, e.g., PostgreSQL)
- **Authentication:** NextAuth.js
- **Testing:** Vitest, Playwright (E2E), MSW (API mocking)
- **CI/CD:** GitHub Actions (planned)

## Folder Structure
- `app/` — Next.js app router, pages, API routes
- `components/` — UI and feature components
- `hooks/` — Custom React hooks
- `lib/` — Utility libraries (API error, auth, etc.)
- `prisma/` — Prisma schema and seed scripts
- `__tests__/` — Unit and integration tests
- `e2e/` — End-to-end tests
- `public/` — Static assets
- `styles/` — Global styles
- `types/` — TypeScript type definitions

## Data Flow
- API routes handle requests, validate input, and interact with the database via Prisma.
- Errors are standardized using `ApiError` and returned with error codes.
- Authentication is managed via NextAuth, with session checks in protected routes.
- Frontend components fetch data from API routes and render UI.

## Error Handling
- All API routes use a centralized `ApiError` class for consistent error responses.
- Error codes are included in all error responses for type safety and debugging.

## Extensibility
- Modular component and API structure for easy feature addition.
- Testable architecture with MSW and Vitest.

## Deployment
- Containerized via Dockerfile (optional)
- CI/CD planned with GitHub Actions for tests, coverage, and security.

---
For more details, see CONTRIBUTING.md and API_DESIGN.md.