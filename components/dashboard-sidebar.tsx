"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  BookOpen,
  LogOut,
  FileQuestion,
  FileText,
  Megaphone,
  MessageCircle,
  Bot,
  QrCode,
  Settings,
  UserPlus,
  User,
  Menu,
  Shield,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"
import type { UserRole } from "@/lib/types"

interface SidebarProps {
  role: UserRole
  userName: string
  userAvatar?: string
}

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/users", label: "User Accounts", icon: UserPlus },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/parents", label: "Parents", icon: Users },
  { href: "/admin/classes", label: "Classes", icon: BookOpen },
  { href: "/admin/lessons", label: "Lessons", icon: FileText },
  { href: "/admin/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/grades", label: "Grades", icon: Calendar },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/chat", label: "Messages", icon: MessageCircle },
  { href: "/admin/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Shield },
  { href: "/admin/profile", label: "My Profile", icon: User },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const teacherLinks = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/lessons", label: "Lessons", icon: FileText },
  { href: "/teacher/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/teacher/assignments", label: "Assignments", icon: FileText },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/qr-attendance", label: "QR Attendance", icon: QrCode },
  { href: "/teacher/grades", label: "Grades", icon: Calendar },
  { href: "/teacher/analytics", label: "Analytics", icon: Users },
  { href: "/teacher/calendar", label: "Calendar", icon: Calendar },
  { href: "/teacher/schedule", label: "Schedule", icon: Calendar },
  { href: "/teacher/chat", label: "Messages", icon: MessageCircle },
  { href: "/teacher/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/teacher/profile", label: "My Profile", icon: User },
]

const studentLinks = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
  { href: "/student/classes", label: "My Classes", icon: BookOpen },
  { href: "/student/lessons", label: "Lessons", icon: FileText },
  { href: "/student/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/student/assignments", label: "Assignments", icon: FileText },
  { href: "/student/grades", label: "My Grades", icon: Calendar },
  { href: "/student/analytics", label: "Progress", icon: Users },
  { href: "/student/calendar", label: "Calendar", icon: Calendar },
  { href: "/student/schedule", label: "Schedule", icon: Calendar },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/qr-checkin", label: "QR Check-in", icon: QrCode },
  { href: "/student/chat", label: "Messages", icon: MessageCircle },
  { href: "/student/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/student/profile", label: "My Profile", icon: User },
]

const parentLinks = [
  { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/grades", label: "Grades", icon: Calendar },
  { href: "/parent/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/parent/calendar", label: "Calendar", icon: Calendar },
  { href: "/parent/chat", label: "Messages", icon: MessageCircle },
  { href: "/parent/announcements", label: "Announcements", icon: Megaphone },
]

function SidebarContent({ 
  role, 
  userName, 
  userAvatar, 
  onLinkClick 
}: SidebarProps & { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const links = role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : role === "parent" ? parentLinks : studentLinks
  const roleLabel = role === "admin" ? "Administrator" : role === "teacher" ? "Teacher" : role === "parent" ? "Parent" : "Student"

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">LessonGo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel}</p>
          </div>
        </div>
        <div className="mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-sidebar-foreground/70"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardSidebar({ role, userName, userAvatar }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent 
              role={role} 
              userName={userName} 
              userAvatar={userAvatar}
              onLinkClick={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">LessonGo</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent role={role} userName={userName} userAvatar={userAvatar} />
      </aside>
    </>
  )
}
