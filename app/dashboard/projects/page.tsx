"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED"

interface ProjectItem {
  id: string
  name: string
  status: ProjectStatus
  budget: number | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  createdBy: string
  myRole: "OWNER" | "MANAGER" | "MEMBER" | "ADMIN" | null
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ProjectItem | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("PLANNING")
  const [budget, setBudget] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const canManage = useMemo(() => (p: ProjectItem) => {
    if (isAdmin) return true
    return p.myRole === "OWNER" || p.myRole === "MANAGER"
  }, [isAdmin])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/projects")
      const json = await res.json()
      setProjects(json.projects || [])
    } catch {
      toast({ description: "프로젝트를 불러오지 못했습니다.", variant: "destructive" })
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
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          budget: budget ? Number(budget) : undefined,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      })
      if (!res.ok) throw new Error("failed")
      resetForm()
      toast({ description: "프로젝트가 생성되었습니다." })
      await load()
    } catch {
      toast({ description: "생성에 실패했습니다.", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          status,
          budget: budget ? Number(budget) : null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      })
      if (!res.ok) throw new Error("failed")
      toast({ description: "프로젝트가 업데이트되었습니다." })
      setEditing(null)
      await load()
    } catch {
      toast({ description: "업데이트에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("failed")
      toast({ description: "프로젝트가 삭제되었습니다." })
      await load()
    } catch {
      toast({ description: "삭제에 실패했습니다.", variant: "destructive" })
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
