"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { projectsApi, type ProjectStatus, type Project } from "@/lib/api/projects"
import { isApiError } from "@/lib/api-error"

export default function ProjectsPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("PLANNING")
  const [budget, setBudget] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const canManage = useMemo(() => (p: Project) => {
    if (isAdmin) return true
    return p.myRole === "OWNER" || p.myRole === "MANAGER"
  }, [isAdmin])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { projects: data } = await projectsApi.list()
      setProjects(data)
    } catch (error) {
      const message = isApiError(error) ? error.message : "프로젝트를 불러오지 못했습니다."
      toast({ description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setName("")
    setDescription("")
    setStatus("PLANNING")
    setBudget("")
    setStartDate("")
    setEndDate("")
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ description: "이름을 입력해주세요.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await projectsApi.create({
        name,
        description,
        budget: budget ? Number(budget) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      resetForm()
      toast({ description: "프로젝트가 생성되었습니다." })
      await load()
    } catch (error) {
      const message = isApiError(error) ? error.message : "생성에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await projectsApi.update(editing.id, {
        name,
        description,
        status,
        budget: budget ? Number(budget) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      toast({ description: "프로젝트가 업데이트되었습니다." })
      setEditing(null)
      await load()
    } catch (error) {
      const message = isApiError(error) ? error.message : "업데이트에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.delete(id)
      toast({ description: "프로젝트가 삭제되었습니다." })
      await load()
    } catch (error) {
      const message = isApiError(error) ? error.message : "삭제에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>새 프로젝트</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>프로젝트 생성</DialogTitle>
                <DialogDescription>새로운 프로젝트를 생성합니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>이름</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>설명</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>예산</Label>
                    <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                  <div>
                    <Label>상태</Label>
                    <Select value={status} onValueChange={(v: ProjectStatus) => setStatus(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNING">기획</SelectItem>
                        <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                        <SelectItem value="ON_HOLD">보류</SelectItem>
                        <SelectItem value="COMPLETED">완료</SelectItem>
                        <SelectItem value="CANCELLED">취소</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>시작일</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>종료일</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="pt-2">
                  <Button disabled={creating} onClick={handleCreate}>
                    {creating ? "생성 중..." : "생성"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{p.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">예산: {p.budget ?? "-"}</div>
                <div className="text-sm text-muted-foreground">기간: {p.startDate || "-"} ~ {p.endDate || "-"}</div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/dashboard/projects/${p.id}`}>
                    <Button variant="outline" size="sm">보기</Button>
                  </Link>
                  {canManage(p) && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditing(p)
                            setName(p.name)
                            setDescription("")
                            setStatus(p.status)
                            setBudget(p.budget?.toString() || "")
                            setStartDate(p.startDate || "")
                            setEndDate(p.endDate || "")
                          }}>편집</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px]">
                          <DialogHeader>
                            <DialogTitle>프로젝트 편집</DialogTitle>
                            <DialogDescription>프로젝트 정보를 수정합니다.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>이름</Label>
                              <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                              <Label>설명</Label>
                              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>예산</Label>
                                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                              </div>
                              <div>
                                <Label>상태</Label>
                                <Select value={status} onValueChange={(v: ProjectStatus) => setStatus(v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="상태" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PLANNING">기획</SelectItem>
                                    <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                                    <SelectItem value="ON_HOLD">보류</SelectItem>
                                    <SelectItem value="COMPLETED">완료</SelectItem>
                                    <SelectItem value="CANCELLED">취소</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>시작일</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                              </div>
                              <div>
                                <Label>종료일</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                              </div>
                            </div>
                            <div className="pt-2">
                              <Button onClick={handleSaveEdit}>저장</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>삭제</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && <div className="text-sm text-muted-foreground">로딩 중...</div>}
      </div>
    </Layout>
  )
}
