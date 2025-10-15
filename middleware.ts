import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")

    // 인증되지 않은 사용자가 대시보드에 접근하려는 경우
    if (isDashboard && !isAuth) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // 인증된 사용자가 auth 페이지에 접근하려는 경우
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // 관리자 전용 경로 체크 (필요시 확장 가능)
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 인증이 필요한 페이지들
        const protectedPaths = ["/dashboard", "/admin"]
        const isProtectedPath = protectedPaths.some(path => 
          req.nextUrl.pathname.startsWith(path)
        )

        if (isProtectedPath) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}