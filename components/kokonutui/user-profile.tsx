"use client"

import { LogOut, Settings, CreditCard, User, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { signOut } from "next-auth/react"

interface Profile01Props {
  avatar: string
  userName?: string | null
  userEmail?: string | null
  userRole?: string
}

export default function Profile01({
  avatar,
  userName,
  userEmail,
  userRole,
}: Profile01Props) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative px-6 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative shrink-0">
              <Image
                src={avatar}
                alt={`${userName || "User"} profile picture`}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-zinc-100 dark:ring-zinc-800"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {userName || "사용자"}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {userEmail}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {userRole === "관리자" ? (
                  <Shield className="w-3 h-3 text-orange-500" />
                ) : (
                  <User className="w-3 h-3 text-blue-500" />
                )}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors duration-200"
            >
              <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">프로필</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">설정</span>
            </Link>

            <Link
              href="/dashboard/billing"
              className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors duration-200"
            >
              <CreditCard className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">결제</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}