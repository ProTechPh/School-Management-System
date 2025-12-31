"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

// Convert LRN to DepEd email format
const formatLoginEmail = (input: string): string => {
  // If input is 12-digit LRN, convert to DepEd email format
  if (/^\d{12}$/.test(input.trim())) {
    return `${input.trim()}@r1.deped.gov.ph`
  }
  // Otherwise return as-is (regular email)
  return input.trim()
}

export default function LoginPage() {
  const router = useRouter()
  const [emailOrLrn, setEmailOrLrn] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    
    // Convert LRN to email format if needed
    const email = formatLoginEmail(emailOrLrn)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Small delay to ensure session is established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Get user role, status, and password change requirement from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, is_active, must_change_password")
        .eq("id", data.user.id)
        .single()

      if (userError) {
        console.error("Error fetching user role:", userError)
        // Try getting role from auth metadata as fallback
        const role = data.user.user_metadata?.role
        if (role) {
          toast.success("Welcome back!")
          router.push(`/${role}`)
          setLoading(false)
          return
        }
        setError("Unable to fetch user data. Please try again.")
        setLoading(false)
        return
      }

      // Check if account is disabled
      if (userData?.is_active === false) {
        await supabase.auth.signOut()
        setError("Your account has been disabled. Please contact your administrator.")
        setLoading(false)
        return
      }

      // Check if user must change password on first login
      if (userData?.must_change_password === true) {
        router.push("/change-password")
        setLoading(false)
        return
      }

      toast.success("Welcome back!")
      
      if (userData?.role) {
        router.push(`/${userData.role}`)
      } else {
        // Fallback to auth metadata
        const role = data.user.user_metadata?.role
        if (role) {
          router.push(`/${role}`)
        } else {
          router.push("/")
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
    </div>
  )
}
