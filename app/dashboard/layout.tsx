import Sidebar from "@/components/kokonutui/sidebar"
import TopNav from "@/components/kokonutui/top-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="w-full flex flex-1 flex-col">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TopNav />
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  )
}
