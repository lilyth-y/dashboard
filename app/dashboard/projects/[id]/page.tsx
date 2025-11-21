"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react"
import { DayButton } from "react-day-picker"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import {
  type Milestone,
  type MilestoneStatus,
  milestonesApi,
} from "@/lib/api/milestones"
import {
  type ProjectMember,
  type ProjectMemberRole,
  projectsApi,
} from "@/lib/api/projects"
import {
  type Task,
  type TaskStatus,
  type Priority,
  tasksApi,
} from "@/lib/api/tasks"
import { isApiError } from "@/lib/api-error"

type MemberItem = ProjectMember
type TaskItem = Task
type MilestoneItem = Milestone

interface KanbanBoardProps {
  tasks: TaskItem[]
  canManage: boolean
  onDropStatus: (taskId: string, status: TaskStatus) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAssign: (taskId: string, userId: string | "UNASSIGNED") => void | Promise<void>
  members: MemberItem[]
  onReloadTasks?: () => void | Promise<void>
  onSaveTaskFields?: (
    taskId: string,
    patch: Partial<Pick<TaskItem, 'title' | 'description' | 'priority' | 'dueDate'>>,
  ) => Promise<void>
  onTaskClick?: (task: TaskItem) => void
}

function KanbanBoard({ tasks, canManage, onDropStatus, onDelete, onAssign, members, onTaskClick }: KanbanBoardProps) {
  const [over, setOver] = useState<TaskStatus | null>(null)
  const columns: Array<{ status: TaskStatus; title: string }> = [
    { status: "TODO", title: "To Do" },
    { status: "IN_PROGRESS", title: "In Progress" },
    { status: "REVIEW", title: "Review" },
    { status: "DONE", title: "Done" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        const isOver = over === col.status
        return (
          <div
            key={col.status}
            className={`rounded-md border ${isOver ? "border-primary" : "border-dashed border-muted"} bg-background/30 p-3 min-h-[160px]`}
            data-status={col.status}
            onDragOver={(e) => {
              if (!canManage) return
              e.preventDefault()
              setOver(col.status)
            }}
            onDragLeave={() => {
              if (over === col.status) setOver(null)
            }}
            onDrop={(e) => {
              if (!canManage) return
              e.preventDefault()
              const id = e.dataTransfer.getData("text/plain")
              if (id) {
                void onDropStatus(id, col.status)
              }
              setOver(null)
            }}
            aria-label={`${col.title} column`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">{col.title}</div>
              <div className="text-xs text-muted-foreground">{colTasks.length}</div>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable={canManage}
                  onDragStart={(e) => {
                    if (!canManage) return
                    e.dataTransfer.setData("text/plain", t.id)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onClick={() => { if (onTaskClick) onTaskClick(t) }}
                  className="cursor-grab active:cursor-grabbing rounded border bg-card p-3 shadow-sm"
                >
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    우선순위: {t.priority} {t.dueDate ? `· 마감: ${t.dueDate}` : ""}
                  </div>
                  <div className="mt-2 text-xs">
                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">담당자</Label>
                        <Select
                          value={t.assignedTo ?? "UNASSIGNED"}
                          onValueChange={(v: string) => onAssign(t.id, v === "UNASSIGNED" ? "UNASSIGNED" : v)}
                        >
                          <SelectTrigger className="h-7 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNASSIGNED">미지정</SelectItem>
                            {members.map((m) => (
                              <SelectItem key={m.userId} value={m.userId}>
                                {m.user?.name || m.user?.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        담당자: {(() => {
                          if (!t.assignedTo) return "미지정"
                          const m = members.find((mm) => mm.userId === t.assignedTo)
                          return m?.user?.name || m?.user?.email || "미지정"
                        })()}
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <div className="mt-2">
                      <Button size="sm" variant="destructive" onClick={() => onDelete(t.id)}>
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="text-xs text-muted-foreground">이 열에 태스크가 없습니다.</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  canManage,
  members,
  onAssign,
  onDelete,
  onSaved,
  onSaveTaskFields,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  task: TaskItem | null
  canManage: boolean
  members: MemberItem[]
  onAssign: (taskId: string, userId: string | "UNASSIGNED") => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSaved?: () => void | Promise<void>
  onSaveTaskFields?: (
    taskId: string,
    patch: Partial<Pick<TaskItem, 'title' | 'description' | 'priority' | 'dueDate'>>,
  ) => Promise<void>
}) {
  const headingId = useId()
  const titleId = useId()
  const descId = useId()
  const dueId = useId()
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const saveButtonRef = useRef<HTMLButtonElement | null>(null)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [due, setDue] = useState("")
  const [assignee, setAssignee] = useState<string | "UNASSIGNED">("UNASSIGNED")

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDesc(task.description || "")
      setPriority(task.priority)
      setDue(task.dueDate || "")
      setAssignee(task.assignedTo ?? "UNASSIGNED")
    }
  }, [task])

  // Focus first field when dialog opens
  useEffect(() => {
    if (open) {
      // Defer focus to next tick to ensure the input is mounted
      const id = setTimeout(() => titleInputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [open, task])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onOpenChange(false)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && canManage) {
      // Only allow save if title is non-empty
      if (title.trim().length > 0) {
        e.preventDefault()
        saveButtonRef.current?.click()
      }
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={headingId} onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle id={headingId}>태스크 상세</DialogTitle>
          <DialogDescription>태스크의 정보를 확인하고 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor={titleId}>제목</Label>
            <Input id={titleId} ref={titleInputRef} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canManage} />
          </div>
          <div>
            <Label htmlFor={descId}>설명</Label>
            <Input id={descId} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={!canManage} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label>우선순위</Label>
              <Select aria-label="우선순위" value={priority} onValueChange={(v: Priority) => setPriority(v)} disabled={!canManage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="URGENT">URGENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={dueId}>마감일</Label>
              <Input id={dueId} type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={!canManage} />
            </div>
            <div>
              <Label>담당자</Label>
              <Select
                aria-label="담당자"
                value={assignee}
                onValueChange={(v: string) => {
                  const next = v === 'UNASSIGNED' ? 'UNASSIGNED' : v
                  setAssignee(next)
                  onAssign(task.id, next)
                }}
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">미지정</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>닫기</Button>
          {canManage && (
            <Button variant="destructive" onClick={() => { onDelete(task.id); onOpenChange(false) }}>삭제</Button>
          )}
          {canManage && (
            <SaveTaskButton
              taskId={task.id}
              patch={{ title, description: desc, priority, dueDate: due || null }}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
              onSaveTaskFields={onSaveTaskFields}
              buttonRef={saveButtonRef}
              disabled={!title.trim()}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SaveTaskButton({ taskId, patch, onClose, onSaved, onSaveTaskFields, buttonRef, disabled }: { taskId: string; patch: Partial<Pick<TaskItem, "title" | "description" | "priority" | "dueDate">>; onClose: () => void; onSaved?: () => void | Promise<void>; onSaveTaskFields?: (taskId: string, patch: Partial<Pick<TaskItem, 'title' | 'description' | 'priority' | 'dueDate'>>) => Promise<void>; buttonRef?: React.RefObject<HTMLButtonElement | null>; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const doSave = async () => {
    try {
      setLoading(true)
      if (onSaveTaskFields) {
        // Use optimistic save provided by parent
        await onSaveTaskFields(taskId, patch)
      } else {
        // Fallback to server-first save
        const res = await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
        if (!res.ok) throw new Error("failed")
      }
      onClose()
      if (onSaved) await onSaved()
      toast({ description: "태스크가 저장되었습니다." })
    } catch {
      toast({ description: "저장 실패", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button ref={buttonRef} onClick={doSave} disabled={loading || !!disabled}>{loading ? "저장중..." : "저장"}</Button>
  )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = params.id
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [members, setMembers] = useState<MemberItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [milestones, setMilestones] = useState<MilestoneItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  // Dialog state (lifted to parent for deep-link)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

  const canManage = useCallback((myRole?: ProjectMemberRole | null) => {
    if (isAdmin) return true
    return myRole === "OWNER" || myRole === "MANAGER"
  }, [isAdmin])

  const myRole = useMemo<ProjectMemberRole | null>(() => {
    if (isAdmin) return "OWNER" // 관리자에게 관리 권한 부여
    const me = members.find((m) => m.userId === user?.id)
    return me?.role ?? null
  }, [isAdmin, members, user?.id])

  const loadMembers = useCallback(async () => {
    try {
      const { members: data } = await projectsApi.getMembers(projectId)
      setMembers(data)
    } catch (error) {
      const message = isApiError(error) ? error.message : "멤버를 불러오지 못했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }, [projectId, toast])

  const loadTasks = useCallback(async () => {
    try {
      const { tasks: data } = await tasksApi.list(projectId)
      setTasks(data)
    } catch (error) {
      const message = isApiError(error) ? error.message : "태스크를 불러오지 못했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }, [projectId, toast])

  const loadMilestones = useCallback(async () => {
    try {
      const { milestones: data } = await milestonesApi.list(projectId)
      setMilestones(data)
    } catch (error) {
      const message = isApiError(error) ? error.message : "마일스톤을 불러오지 못했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }, [projectId, toast])

  useEffect(() => {
    loadMembers()
    loadTasks()
    loadMilestones()
  }, [loadMembers, loadTasks, loadMilestones])

  // Member add
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>("MEMBER")
  const onInvite = async () => {
    try {
      await projectsApi.addMember(projectId, { email: inviteEmail, role: inviteRole })
      setInviteEmail("")
      setInviteRole("MEMBER")
      await loadMembers()
      toast({ description: "멤버가 추가되었습니다." })
    } catch (error) {
      const message = isApiError(error) ? error.message : "멤버 추가에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const onRoleChange = async (userId: string, role: ProjectMemberRole) => {
    try {
      await projectsApi.updateMemberRole(projectId, userId, { role })
      await loadMembers()
      toast({ description: "역할이 변경되었습니다." })
    } catch (error) {
      const message = isApiError(error) ? error.message : "역할 변경에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const onRemove = async (userId: string) => {
    try {
      await projectsApi.removeMember(projectId, userId)
      await loadMembers()
      toast({ description: "멤버가 제거되었습니다." })
    } catch (error) {
      const message = isApiError(error) ? error.message : "멤버 제거에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  // Task create
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskPriority, setTaskPriority] = useState<Priority>("MEDIUM")
  const [taskDue, setTaskDue] = useState("")
  const [taskAssignee, setTaskAssignee] = useState<string | "UNASSIGNED">("UNASSIGNED")
  const onCreateTask = async () => {
    try {
      await tasksApi.create(projectId, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDue || null,
        assignedTo: taskAssignee === "UNASSIGNED" ? null : taskAssignee,
      })
      setTaskTitle("")
      setTaskDesc("")
      setTaskPriority("MEDIUM")
      setTaskDue("")
      setTaskAssignee("UNASSIGNED")
      await loadTasks()
      toast({ description: "태스크가 생성되었습니다." })
    } catch (error) {
      const message = isApiError(error) ? error.message : "태스크 생성에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const onUpdateTask = async (
    id: string,
    patch: Partial<Pick<TaskItem, "status" | "priority" | "assignedTo" | "dueDate" | "title" | "description">>,
  ) => {
    try {
      await tasksApi.update(id, patch)
      await loadTasks()
    } catch (error) {
      const message = isApiError(error) ? error.message : "태스크 업데이트에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  // Optimistic saver for dialog edits
  const onSaveTaskFieldsOptimistic = async (
    id: string,
    patch: Partial<Pick<TaskItem, 'title' | 'description' | 'priority' | 'dueDate'>>,
  ) => {
    const prev = tasks
    // Apply optimistic change
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    try {
      await onUpdateTask(id, patch)
    } catch {
      // Rollback on error
      setTasks(prev)
      throw new Error('save failed')
    }
  }

  const onDeleteTask = async (id: string) => {
    const prev = tasks
    // Optimistically remove the task
    setTasks((cur) => cur.filter((t) => t.id !== id))
    try {
      await tasksApi.delete(id)
      toast({ description: "태스크가 삭제되었습니다." })
    } catch (error) {
      // Rollback on error
      setTasks(prev)
      const message = isApiError(error) ? error.message : "태스크 삭제에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  // Milestone create
  const [msTitle, setMsTitle] = useState("")
  const [msDesc, setMsDesc] = useState("")
  const [msDue, setMsDue] = useState("")
  const onCreateMilestone = async () => {
    try {
      await milestonesApi.create(projectId, {
        title: msTitle,
        description: msDesc,
        dueDate: msDue,
      })
      setMsTitle("")
      setMsDesc("")
      setMsDue("")
      await loadMilestones()
      toast({ description: "마일스톤이 생성되었습니다." })
    } catch (error) {
      const message = isApiError(error) ? error.message : "마일스톤 생성에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const onUpdateMilestone = async (id: string, patch: Partial<{ status: MilestoneStatus; title: string; description: string; dueDate: string }>) => {
    try {
      await milestonesApi.update(id, patch)
      await loadMilestones()
    } catch (error) {
      const message = isApiError(error) ? error.message : "마일스톤 업데이트에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  const onDeleteMilestone = async (id: string) => {
    try {
      await milestonesApi.delete(id)
      await loadMilestones()
    } catch (error) {
      const message = isApiError(error) ? error.message : "마일스톤 삭제에 실패했습니다."
      toast({ description: message, variant: "destructive" })
    }
  }

  // Calendar helpers
  const milestoneDates = useMemo(() => {
    const s = new Set<string>()
    milestones.forEach((m) => {
      const d = new Date(m.dueDate)
      const key = d.toISOString().split("T")[0]
      s.add(key)
    })
    return s
  }, [milestones])

  const MilestoneDayButton = (props: React.ComponentProps<typeof DayButton>) => {
    const date = props.day.date as Date
    const key = date.toISOString().split("T")[0]
    const hasMs = milestoneDates.has(key)
    return (
      <DayButton {...props} className="relative">
        {props.children}
        {hasMs && (
          <span className="absolute bottom-1 block w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
        )}
      </DayButton>
    )
  }

  // Task filters
  const [filterAssignee, setFilterAssignee] = useState<string | "ALL">("ALL")
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL")
  const [filterFrom, setFilterFrom] = useState<string>("")
  const [filterTo, setFilterTo] = useState<string>("")

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAssignee !== "ALL") {
        const assignee = t.assignedTo ?? "UNASSIGNED"
        if (assignee !== filterAssignee) return false
      }
      if (filterPriority !== "ALL" && t.priority !== filterPriority) return false
      if (filterFrom) {
        if (!t.dueDate || t.dueDate < filterFrom) return false
      }
      if (filterTo) {
        if (!t.dueDate || t.dueDate > filterTo) return false
      }
      return true
    })
  }, [tasks, filterAssignee, filterPriority, filterFrom, filterTo])

  const resetFilters = () => {
    setFilterAssignee("ALL")
    setFilterPriority("ALL")
    setFilterFrom("")
    setFilterTo("")
  }

  // URL/localStorage sync for filters and selectedDate
  useEffect(() => {
    // On mount, load from URL or localStorage
    const qAssignee = searchParams.get("assignee")
    const qPriority = searchParams.get("priority")
    const qFrom = searchParams.get("from")
    const qTo = searchParams.get("to")
    const qSel = searchParams.get("ms")

    const ls = typeof window !== "undefined" ? window.localStorage : null
    const ns = (k: string) => `proj:${projectId}:${k}`
    // Assignee: prefer namespaced, fallback to legacy
    setFilterAssignee(qAssignee ?? ls?.getItem(ns("filterAssignee")) ?? ls?.getItem("projFilterAssignee") ?? "ALL")
    // Priority: validate against allowed values to satisfy strict typing
    const qp = qPriority ?? ls?.getItem(ns("filterPriority")) ?? ls?.getItem("projFilterPriority") ?? "ALL"
    let pr: Priority | "ALL" = "ALL"
    switch (qp) {
      case "LOW":
      case "MEDIUM":
      case "HIGH":
      case "URGENT":
      case "ALL":
        pr = qp
        break
      default:
        pr = "ALL"
    }
    setFilterPriority(pr)
    setFilterFrom(qFrom || ls?.getItem(ns("filterFrom")) || ls?.getItem("projFilterFrom") || "")
    setFilterTo(qTo || ls?.getItem(ns("filterTo")) || ls?.getItem("projFilterTo") || "")
    if (qSel || ls?.getItem(ns("selectedDate")) || ls?.getItem("projSelectedDate")) {
      const v = qSel || (ls?.getItem(ns("selectedDate")) as string) || (ls?.getItem("projSelectedDate") as string)
      if (v) setSelectedDate(new Date(v))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("assignee", String(filterAssignee))
    params.set("priority", String(filterPriority))
    if (filterFrom) params.set("from", filterFrom); else params.delete("from")
    if (filterTo) params.set("to", filterTo); else params.delete("to")
    if (selectedDate) params.set("ms", selectedDate.toISOString().split("T")[0]); else params.delete("ms")
    
    router.replace(`${pathname}?${params.toString()}`)

    if (typeof window !== "undefined") {
      const ls = window.localStorage
      const ns = (k: string) => `proj:${projectId}:${k}`
      ls.setItem(ns("filterAssignee"), String(filterAssignee))
      ls.setItem(ns("filterPriority"), String(filterPriority))
      ls.setItem(ns("filterFrom"), filterFrom)
      ls.setItem(ns("filterTo"), filterTo)
      ls.setItem(ns("selectedDate"), selectedDate ? selectedDate.toISOString() : "")
    }
  }, [projectId, filterAssignee, filterPriority, filterFrom, filterTo, selectedDate, dialogOpen, activeTask?.id, router, pathname, searchParams])

  // On mount or URL change, open dialog from task query
  useEffect(() => {
    const qTask = searchParams.get('task')
    if (qTask) {
      const t = tasks.find((tt) => tt.id === qTask)
      if (t) {
        if (activeTask?.id !== t.id) {
          setActiveTask(t)
          setDialogOpen(true)
        } else if (activeTask !== t) {
          setActiveTask(t)
        }
      }
    } else {
      if (dialogOpen) setDialogOpen(false)
      if (activeTask) setActiveTask(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tasks])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>멤버</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManage(myRole) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label>이메일</Label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div>
                  <Label>역할</Label>
                  <Select value={inviteRole} onValueChange={(v: ProjectMemberRole) => setInviteRole(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="역할" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">MEMBER</SelectItem>
                      <SelectItem value="MANAGER">MANAGER</SelectItem>
                      <SelectItem value="OWNER">OWNER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={onInvite}>초대</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between border rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-medium">{m.user?.name || m.user?.email}</div>
                    <div className="text-muted-foreground">{m.user?.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={m.role} onValueChange={(v: ProjectMemberRole) => onRoleChange(m.userId, v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">MEMBER</SelectItem>
                        <SelectItem value="MANAGER">MANAGER</SelectItem>
                        <SelectItem value="OWNER">OWNER</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="destructive" onClick={() => onRemove(m.userId)}>제거</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>태스크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManage(myRole) && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <Label>제목</Label>
                  <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                </div>
                <div>
                  <Label>우선순위</Label>
                  <Select value={taskPriority} onValueChange={(v: Priority) => setTaskPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                      <SelectItem value="URGENT">URGENT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>마감일</Label>
                  <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                </div>
                <div>
                  <Label>담당자</Label>
                  <Select value={taskAssignee} onValueChange={(v: string) => setTaskAssignee(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">미지정</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-4">
                  <Label>설명</Label>
                  <Input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                </div>
                <div className="sm:col-span-4">
                  <Button onClick={onCreateTask}>추가</Button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <div>
                <Label>담당자</Label>
                <Select value={filterAssignee} onValueChange={(v: string) => setFilterAssignee(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="UNASSIGNED">미지정</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>우선순위</Label>
                <Select value={filterPriority} onValueChange={(v: Priority | "ALL") => setFilterPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="URGENT">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>마감 시작</Label>
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div>
                <Label>마감 종료</Label>
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex items-end gap-2">
                <Button variant="secondary" onClick={resetFilters}>필터 초기화</Button>
              </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
              tasks={filteredTasks}
              canManage={canManage(myRole)}
              onDropStatus={async (taskId: string, status: TaskStatus) => {
                // 낙관적 업데이트
                const prev = tasks
                setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, status } : t)))
                try {
                  await onUpdateTask(taskId, { status })
                } catch {
                  // 실패 시 롤백
                  setTasks(prev)
                }
              }}
              onDelete={onDeleteTask}
              onAssign={async (taskId: string, userId: string | "UNASSIGNED") => {
                const prev = tasks
                setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, assignedTo: userId === "UNASSIGNED" ? null : userId } : t)))
                try {
                  await onUpdateTask(taskId, { assignedTo: userId === "UNASSIGNED" ? null : userId })
                } catch {
                  setTasks(prev)
                }
              }}
              members={members}
              onReloadTasks={loadTasks}
              onSaveTaskFields={onSaveTaskFieldsOptimistic}
              onTaskClick={(t) => {
                setActiveTask(t)
                setDialogOpen(true)
                const params = new URLSearchParams(searchParams.toString())
                params.set("task", t.id)
                router.replace(`${pathname}?${params.toString()}`)
              }}
            />
            {/* Task detail dialog at parent level for deep-link */}
            <TaskDetailDialog
              open={dialogOpen}
              onOpenChange={(v) => {
                setDialogOpen(v)
                if (!v) {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("task")
                  router.replace(`${pathname}?${params.toString()}`)
                }
              }}
              task={activeTask}
              canManage={canManage(myRole)}
              members={members}
              onAssign={async (taskId, userId) => {
                const prev = tasks
                setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, assignedTo: userId === 'UNASSIGNED' ? null : userId } : t)))
                try {
                  await onUpdateTask(taskId, { assignedTo: userId === 'UNASSIGNED' ? null : userId })
                } catch {
                  setTasks(prev)
                }
              }}
              onDelete={onDeleteTask}
              onSaved={loadTasks}
              onSaveTaskFields={onSaveTaskFieldsOptimistic}
            />
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>마일스톤</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendar View */}
            <div className="border rounded-md p-3">
              <Calendar
                components={{ DayButton: (props) => <MilestoneDayButton {...props} /> }}
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                captionLayout="dropdown"
                className="mx-auto"
              />
              {selectedDate && (
                <div className="mt-3 text-sm text-muted-foreground">
                  선택된 날짜: {selectedDate.toISOString().split("T")[0]}
                </div>
              )}
            </div>

            {canManage(myRole) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label>제목</Label>
                  <Input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} />
                </div>
                <div>
                  <Label>마감일</Label>
                  <Input type="date" value={msDue} onChange={(e) => setMsDue(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={onCreateMilestone}>추가</Button>
                </div>
                <div className="sm:col-span-3">
                  <Label>설명</Label>
                  <Input value={msDesc} onChange={(e) => setMsDesc(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {milestones
                .filter((m) => {
                  if (!selectedDate) return true
                  const d = new Date(m.dueDate).toISOString().split("T")[0]
                  const sel = selectedDate.toISOString().split("T")[0]
                  return d === sel
                })
                .map((m) => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-muted-foreground">마감: {m.dueDate}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage(myRole) ? (
                      <>
                        <Select value={m.status} onValueChange={(v: MilestoneStatus) => onUpdateMilestone(m.id, { status: v })}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                            <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="destructive" onClick={() => onDeleteMilestone(m.id)}>삭제</Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">상태: {m.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

// Exported for testing
export { TaskDetailDialog }
