"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { trackUserAction } from "@/lib/analytics"
import { generateFingerprint, storeSessionToken } from "@/lib/fingerprint"
import Link from "next/link"

const formatLoginEmail = (input: string): string => {
  if (/^\d{12}$/.test(input.trim())) {
    return `${input.trim()}@r1.deped.gov.ph`
  }
  return input.trim()
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [emailOrLrn, setEmailOrLrn] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Show session timeout message if redirected due to timeout
  useEffect(() => {
    const reason = searchParams.get("reason")
    if (reason === "session_timeout") {
      toast.info("Your session has expired due to inactivity. Please log in again.")
      router.replace("/login")
    } else if (reason === "session_invalid") {
      toast.error("Your session was invalidated for security reasons. Please log in again.")
      router.replace("/login")
    }
  }, [searchParams, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const email = formatLoginEmail(emailOrLrn)

    try {
      // Generate browser fingerprint for session binding
      const fingerprint = generateFingerprint()
      
      // Use secure API route with rate limiting
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fingerprint }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Show new device notification if applicable
      if (data.isNewDevice) {
        toast.info("New device detected. This login has been recorded.")
      }

      // Login successful, check user role/password policy
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, must_change_password")
          .eq("id", user.id)
          .single()

        // Track successful login
        if (userData?.role) {
          trackUserAction('login', user.id, userData.role as any, {
            method: 'password',
            timestamp: new Date().toISOString(),
          })
        }

        if (userData?.must_change_password === true) {
          router.push("/change-password")
          return
        }

        toast.success("Welcome back!")
        
        if (userData?.role) {
          router.push(`/${userData.role}`)
        } else {
          router.push("/")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome to LessonGo</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrLrn">Email or LRN</Label>
            <Input
              id="emailOrLrn"
              type="text"
              placeholder="Email or 12-digit LRN"
              value={emailOrLrn}
              onChange={(e) => setEmailOrLrn(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Students can use their 12-digit LRN to login
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Contact your administrator if you need an account.
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
