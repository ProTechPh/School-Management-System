"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Shield, Lock } from "lucide-react"
import { toast } from "sonner"

export default function MFAEnrollPage() {
  const [step, setStep] = useState<"verify" | "enroll">("verify")
  const [password, setPassword] = useState("")
  const [qrCode, setQrCode] = useState<string>("")
  const [factorId, setFactorId] = useState<string>("")
  const [verifyCode, setVerifyCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handlePasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      })

      if (error) throw error

      setStep("enroll")
      startEnrollment()
    } catch (err: any) {
      setError("Incorrect password")
      setVerifying(false)
    }
  }

  const startEnrollment = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) throw error

      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      })

      if (error) throw error

      toast.success("MFA Enabled Successfully")
      router.push("/admin")
    } catch (err: any) {
      setError(err.message)
      setVerifying(false)
    }
  }

  if (loading) {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle>Secure Your Account</CardTitle>
          <CardDescription>
            {step === "verify" 
              ? "Please verify your password to set up Two-Factor Authentication."
              : "Scan the QR code with your authenticator app."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "verify" ? (
            <form onSubmit={handlePasswordVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={verifying || !password}>
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Identity"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="border-4 border-white shadow-sm rounded-lg" />
                )}
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                Use Google Authenticator or Authy to scan the code above.
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-digit code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={verifying || verifyCode.length !== 6}>
                  {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Verify & Enable MFA
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}