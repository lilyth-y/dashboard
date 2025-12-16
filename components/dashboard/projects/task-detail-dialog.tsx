"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  type Task,
  type Priority,
} from "@/lib/api/tasks"
import {
  type ProjectMember,
} from "@/lib/api/projects"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type MemberItem = ProjectMember
type TaskItem = Task

// Helper component
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

interface TaskDetailDialogProps {
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
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  canManage,
  members,
  onAssign,
  onDelete,
  onSaved,
  onSaveTaskFields,
}: TaskDetailDialogProps) {
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
