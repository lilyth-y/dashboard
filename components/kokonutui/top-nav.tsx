"use client"

import { Bell, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"

import UserProfile from "./user-profile"
import { ThemeToggle } from "../theme-toggle"

interface BreadcrumbItem {
  label: string
  href?: string
}

export default function TopNav() {
  const { user, isAdmin } = useAuth()
  const fallbackAvatar = "/avatar-placeholder.svg"
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "kokonutUI", href: "#" },
    { label: "dashboard", href: "#" },
  ]

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between h-full w-full">
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px]">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <button
          type="button"
          title="알림"
          className="p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground rounded-full transition-colors"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Image
              src={user?.image || fallbackAvatar}
              alt="User avatar"
              width={28}
              height={28}
              className="rounded-full ring-2 ring-border sm:w-8 sm:h-8 cursor-pointer"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
          >
            <UserProfile 
              avatar={user?.image || fallbackAvatar}
              userName={user?.name}
              userEmail={user?.email}
              userRole={isAdmin ? "관리자" : "사용자"}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
