"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  GraduationCap, 
  LogIn, 
  Loader2, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  BarChart3,
  QrCode,
  MessageSquare,
  Shield,
  ArrowRight,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserData {
  id: string
  email?: string
  role: string
  name?: string
  avatar?: string
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserData | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        
        if (response.ok) {
          const { user: userData } = await response.json()
          if (userData) {
            setUser(userData)
          }
        }
      } catch (error) {
        // User not logged in
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/login"
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return email?.charAt(0).toUpperCase() || "U"
  }

  const getDashboardPath = (role?: string) => {
    switch (role) {
      case "admin": return "/admin"
      case "teacher": return "/teacher"
      case "parent": return "/parent"
      default: return "/student"
    }
  }

  const features = [
    {
      icon: BookOpen,
      title: "Class Management",
      description: "Organize classes, lessons, and quizzes in one place",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    {
      icon: QrCode,
      title: "QR Attendance",
      description: "Quick check-in with location verification",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      icon: BarChart3,
      title: "Grade Analytics",
      description: "Track performance with customizable weights",
      color: "text-violet-400",
      bg: "bg-violet-400/10"
    },
    {
      icon: MessageSquare,
      title: "Communication",
      description: "In-app messaging and announcements",
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Tailored dashboards for each user type",
      color: "text-rose-400",
      bg: "bg-rose-400/10"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security and data protection",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10"
    }
  ]

  const stats = [
    { value: "4", label: "User Roles" },
    { value: "15+", label: "Features" },
    { value: "QR", label: "Check-in" },
    { value: "RLS", label: "Security" }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-violet-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LessonGo</span>
          </div>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name || user.email} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardPath(user.role)} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${getDashboardPath(user.role)}/profile`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
            <Shield className="h-4 w-4" />
            <span>Secure school management platform</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
            Daniel Maramba
            <span className="block text-primary">National High School</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto px-4">
            School management system for administrators, teachers, and students. 
            Streamline attendance, grades, communication, and more.
          </p>
          
          {user ? (
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href={getDashboardPath(user.role)}>
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in
              </Link>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Powerful features designed for modern educational institutions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card 
              key={i} 
              className="group bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/80 hover:border-border transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              role: "Admin", 
              icon: Shield,
              description: "Full system access, user management, and analytics dashboard",
              features: ["Manage all users", "View analytics", "System settings"]
            },
            { 
              role: "Teacher", 
              icon: ClipboardCheck,
              description: "Class management, attendance tracking, and grade recording",
              features: ["Create lessons", "Track attendance", "Record grades"]
            },
            { 
              role: "Student", 
              icon: GraduationCap,
              description: "View classes, check grades, and QR code attendance",
              features: ["View schedule", "Check grades", "QR check-in"]
            },
            { 
              role: "Parent", 
              icon: Users,
              description: "Monitor your child's progress, grades, and attendance",
              features: ["View grades", "Track attendance", "Message teachers"]
            }
          ].map((item, i) => (
            <div 
              key={i}
              className="relative p-6 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{item.role}</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
              <ul className="space-y-2">
                {item.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-violet-500/20 border border-primary/20 p-6 sm:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary),0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Contact the DMNHS administrator to get your account set up.
            </p>
            {user ? (
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href={getDashboardPath(user.role)}>
                  Go to your dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/login">
                  Sign in to your account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LessonGo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Daniel Maramba National High School
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
