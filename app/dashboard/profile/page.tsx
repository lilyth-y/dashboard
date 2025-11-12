"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { userApi, type User } from "@/lib/api/user"
import { isApiError } from "@/lib/api-error"

export default function ProfilePage() {
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { user } = await userApi.getCurrentUser()
        setData(user)
      } catch (error) {
        const message = isApiError(error) ? error.message : "프로필 정보를 불러오지 못했습니다."
        toast({ description: message, variant: "destructive" })
      }
    }
    if (isAuthenticated) load()
  }, [isAuthenticated, toast])

  const onSave = async () => {
    if (!data) return;
    if (!data.name || !data.name.trim()) {
      toast({ description: "이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await userApi.updateCurrentUser({ 
        name: data.name ?? undefined, 
        image: data.image ?? undefined 
      });
      toast({ description: "프로필이 업데이트되었습니다." });
    } catch (error) {
      const message = isApiError(error) ? error.message : "업데이트에 실패했습니다.";
      toast({ description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
          <CardDescription>계정 정보를 확인하고 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>이메일</Label>
            <Input value={data?.email || ""} disabled />
          </div>
          <div>
            <Label>이름</Label>
            <Input
              value={data?.name || ""}
              onChange={(e) => setData((d) => (d ? { ...d, name: e.target.value } : d))}
            />
          </div>
          <div>
            <Label>이미지 URL</Label>
            <Input
              placeholder="https://..."
              value={data?.image || ""}
              onChange={(e) => setData((d) => (d ? { ...d, image: e.target.value } : d))}
            />
          </div>
          <div>
            <Label>역할</Label>
            <Input value={data?.role || ""} disabled />
          </div>
          <div className="pt-2">
            <Button disabled={loading} onClick={onSave}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
