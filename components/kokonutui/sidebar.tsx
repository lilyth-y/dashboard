"use client"

import {
  BarChart2,
  Receipt,
  Building2,
  CreditCard,
  Folder,
  Wallet,
  Users2,
  Shield,
  MessagesSquare,
  Video,
  Settings,
  HelpCircle,
  Menu,
} from "lucide-react"
import { Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
  }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={handleNavigation}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "text-sidebar-primary-foreground bg-sidebar-primary"
            : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        }`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        aria-label="Toggle navigation menu"
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-sidebar border border-sidebar-border shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-sidebar-foreground" />
      </button>
      <nav
        className={`
                fixed inset-y-0 left-0 z-[70] w-64 bg-sidebar/95 backdrop-blur-md transform transition-transform duration-200 ease-in-out
                lg:translate-x-0 lg:static lg:w-64 border-r border-sidebar-border
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}
      >
        <div className="h-full flex flex-col">
          <Link
            href="https://kokonutui.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="h-16 px-6 flex items-center border-b border-sidebar-border"
          >
            <div className="flex items-center gap-3">
              <Image
                src="https://kokonutui.com/logo.svg"
                alt="Acme"
                width={32}
                height={32}
                unoptimized
                className="flex-shrink-0 hidden dark:block"
              />
              <Image
                src="https://kokonutui.com/logo-black.svg"
                alt="Acme"
                width={32}
                height={32}
                unoptimized
                className="flex-shrink-0 block dark:hidden"
              />
              <span className="text-lg font-semibold hover:cursor-pointer text-sidebar-foreground">
                KokonutUI
              </span>
            </div>
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/dashboard/analytics" icon={BarChart2}>
                    Analytics
                  </NavItem>
                  <NavItem href="/dashboard/organization" icon={Building2}>
                    Organization
                  </NavItem>
                  <NavItem href="/dashboard/projects" icon={Folder}>
                    Projects
                  </NavItem>
                  <NavItem href="/dashboard/profile" icon={Users2}>
                    Profile
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                  Finance
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard/finance/transactions" icon={Wallet}>
                    Transactions
                  </NavItem>
                  <NavItem href="/dashboard/finance/invoices" icon={Receipt}>
                    Invoices
                  </NavItem>
                  <NavItem href="/dashboard/finance/payments" icon={CreditCard}>
                    Payments
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                  Team
                </div>
                <div className="space-y-1">
                  <NavItem href="#" icon={Users2}>
                    Members
                  </NavItem>
                  <NavItem href="#" icon={Shield}>
                    Permissions
                  </NavItem>
                  <NavItem href="#" icon={MessagesSquare}>
                    Chat
                  </NavItem>
                  <NavItem href="#" icon={Video}>
                    Meetings
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-sidebar-border">
            <div className="space-y-1">
              <NavItem href="/dashboard/profile" icon={Settings}>
                Profile Settings
              </NavItem>
              <NavItem href="#" icon={HelpCircle}>
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
