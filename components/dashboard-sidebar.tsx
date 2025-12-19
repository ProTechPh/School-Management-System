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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
type UserRole = "admin" | "teacher" | "student"

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
  { href: "/admin/classes", label: "Classes", icon: BookOpen },
  { href: "/admin/lessons", label: "Lessons", icon: FileText },
  { href: "/admin/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/grades", label: "Grades", icon: Calendar },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/chat", label: "Messages", icon: MessageCircle },
  { href: "/admin/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/admin/profile", label: "My Profile", icon: User },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const teacherLinks = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/lessons", label: "Lessons", icon: FileText },
  { href: "/teacher/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/qr-attendance", label: "QR Attendance", icon: QrCode },
  { href: "/teacher/grades", label: "Grades", icon: Calendar },
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
  { href: "/student/grades", label: "My Grades", icon: Calendar },
  { href: "/student/schedule", label: "Schedule", icon: Calendar },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/qr-checkin", label: "QR Check-in", icon: QrCode },
  { href: "/student/chat", label: "Messages", icon: MessageCircle },
  { href: "/student/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/student/profile", label: "My Profile", icon: User },
]

export function DashboardSidebar({ role, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : studentLinks
  const roleLabel = role === "admin" ? "Administrator" : role === "teacher" ? "Teacher" : "Student"

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">LessonGo</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
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
    </aside>
  )
}
