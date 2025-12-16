"use client"

import { useState } from "react"
import {
  type Task,
  type TaskStatus,
} from "@/lib/api/tasks"
import {
  type ProjectMember,
} from "@/lib/api/projects"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type MemberItem = ProjectMember
type TaskItem = Task

interface KanbanBoardProps {
  tasks: TaskItem[]
  canManage: boolean
  onDropStatus: (taskId: string, status: TaskStatus) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAssign: (taskId: string, userId: string | "UNASSIGNED") => void | Promise<void>
  members: MemberItem[]
  onTaskClick?: (task: TaskItem) => void
}

export function KanbanBoard({ tasks, canManage, onDropStatus, onDelete, onAssign, members, onTaskClick }: KanbanBoardProps) {
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
