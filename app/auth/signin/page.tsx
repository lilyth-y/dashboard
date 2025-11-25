"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { signIn, getSession, type SignInResponse } from "next-auth/react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(getAuthErrorMessage(result.error, "Credentials"))
      } else {
        const session = await getSession()
        if (session?.user?.role === "ADMIN") {
          router.push("/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      // Use redirect: false so we can show an error message in-place if auth fails
  const result = (await signIn("google", { callbackUrl: "/dashboard", redirect: false })) as SignInResponse | undefined

      // result can be undefined in some environments; defensively check
      if (result && (result as SignInResponse).error) {
        console.error('Google login error (provider):', (result as SignInResponse).error)
        setError(getAuthErrorMessage((result as SignInResponse).error, "Google"))
      } else if (!result) {
        // If no result returned, show a generic message
        console.error('Google login returned no result')
        setError("Google 로그인 중 알 수 없는 오류가 발생했습니다.")
      } else {
        // Successful sign-in will redirect using the callbackUrl; if not, push to dashboard
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      console.error('Google login error:', error)
      setError("Google 로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // Map known NextAuth/provider error codes to friendly Korean messages
  function getAuthErrorMessage(errorCode?: string | null, provider?: string) {
    if (!errorCode) return "로그인 중 오류가 발생했습니다."
    const e = String(errorCode)
    switch (e) {
      case "CredentialsSignin":
      case "Credentials" :
        return "이메일 또는 비밀번호가 올바르지 않습니다."
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return provider ? `${provider} 로그인에 실패했습니다. 다른 계정으로 시도해 주세요.` : "OAuth 로그인에 실패했습니다."
      case "EmailSignin":
        return "이메일 로그인에 실패했습니다. 이메일을 확인하세요."
      case "Verification":
        return "이메일 인증 중 오류가 발생했습니다. 인증 링크를 확인하세요."
      case "AccessDenied":
        return "권한이 없어 로그인할 수 없습니다."
      case "SessionRequired":
        return "작업을 수행하려면 로그인이 필요합니다. 다시 로그인 해주세요."
      case "OAuthAccountNotLinked":
        return "해당 이메일은 다른 인증 방법으로 이미 가입되어 있습니다. 다른 방법으로 로그인하세요."
      default:
        // If provider returned a descriptive message, show it; otherwise generic
        return e || "로그인 중 오류가 발생했습니다."
    }
  }

  // If the page was loaded with an error query param (e.g., ?error=OAuthSignin), show a friendly message
  useEffect(() => {
    const err = searchParams?.get("error")
    if (err) {
      setError(getAuthErrorMessage(err))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            계정에 로그인하여 대시보드에 액세스하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google로 계속하기
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">계정이 없으신가요? </span>
            <button
              onClick={() => router.push("/auth/signup")}
              className="text-primary underline-offset-4 hover:underline"
            >
              회원가입
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}