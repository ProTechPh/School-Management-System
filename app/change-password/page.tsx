"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, KeyRound, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Password requirements
  const hasMinLength = newPassword.length >= 8
  const hasNumber = /\d/.test(newPassword)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isMatch = newPassword && newPassword === confirmPassword

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push("/login")
      return
    }

    setUserEmail(user.email || null)

    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single()

    // If user doesn't strictly need to change password (forced flow), 
    // they can still access this page manually to change it voluntarily.
    // We only redirect away if they are here by accident or logic error, 
    // but allowing voluntary changes is good.
    // However, the prompt implies this page handles both.
    
    setUserRole(userData?.role || null)
    setChecking(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Strict Validation
    if (!hasMinLength || !hasNumber) {
      setError("Password does not meet complexity requirements.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!userEmail) {
      setError("User session invalid. Please login again.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    // SECURITY FIX: Verify old password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    })

    if (signInError) {
      setError("Current password is incorrect.")
      setLoading(false)
      return
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Get current user to update DB flag
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Update must_change_password flag
      await supabase
        .from("users")
        .update({ must_change_password: false })
        .eq("id", user.id)
    }

    toast.success("Password changed successfully!")
    
    // Redirect to dashboard
    if (userRole) {
      router.push(`/${userRole}`)
    } else {
      router.push("/")
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <KeyRound className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Change Your Password</CardTitle>
          <CardDescription>
            For security, please enter your current password and create a new strong password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            
            {/* SECURITY FIX: Current Password Field */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              
              {/* Password Requirements List */}
              <div className="text-xs space-y-1 mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-muted-foreground mb-2">Password Requirements:</p>
                <div className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-muted-foreground"}`}>
                  {hasMinLength ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current ml-1" />}
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-muted-foreground"}`}>
                  {hasNumber ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current ml-1" />}
                  At least one number
                </div>
                <div className={`flex items-center gap-2 ${hasSpecial ? "text-green-600" : "text-muted-foreground"}`}>
                  {hasSpecial ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current ml-1" />}
                  At least one special character (recommended)
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={confirmPassword && !isMatch ? "border-destructive" : ""}
              />
              {confirmPassword && !isMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !currentPassword || !hasMinLength || !hasNumber || !isMatch}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}