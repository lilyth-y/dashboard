"use client"

import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (response.ok) {
        // 회원가입 성공 후 자동 로그인
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          router.push("/dashboard")
        } else {
          router.push("/auth/signin")
        }
      } else {
        const data = await response.json()
        setError(data.message || "회원가입 중 오류가 발생했습니다.")
      }
    } catch (error: unknown) {
      console.error('Signup error:', error)
      setError("회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error: unknown) {
      console.error('Google signup error:', error)
      setError("Google 로그인 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            새 계정을 만들어 대시보드를 시작하세요
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

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
                placeholder="최소 8자"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <button
              onClick={() => router.push("/auth/signin")}
              className="text-primary underline-offset-4 hover:underline"
            >
              로그인
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}