"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Shield, Lock, Copy } from "lucide-react"
import { toast } from "sonner"
import QRCodeStyling from "qr-code-styling"

export default function MFAEnrollPage() {
  const [step, setStep] = useState<"verify" | "enroll">("verify")
  const [password, setPassword] = useState("")
  const [qrCode, setQrCode] = useState<string>("")
  const [secretKey, setSecretKey] = useState<string>("")
  const [totpUri, setTotpUri] = useState<string>("")
  const [factorId, setFactorId] = useState<string>("")
  const [verifyCode, setVerifyCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const qrRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndFactors = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
      
      // Check if user already has verified MFA factor
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (factors && factors.totp.length > 0 && factors.totp[0].status === 'verified') {
        // Already enrolled, redirect to admin
        window.location.href = "/admin"
        return
      }
      
      setLoading(false)
    }
    checkUserAndFactors()
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
        factorType: 'totp',
        issuer: 'LessonGo'
      })

      if (error) throw error

      setFactorId(data.id)
      setSecretKey(data.totp.secret)
      setTotpUri(data.totp.uri)
      setQrCode(data.totp.qr_code)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  // Generate QR code using qr-code-styling library
  useEffect(() => {
    if (totpUri && qrRef.current) {
      qrRef.current.innerHTML = ""
      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        data: totpUri,
        dotsOptions: {
          color: "#000",
          type: "rounded"
        },
        backgroundOptions: {
          color: "#fff"
        },
        cornersSquareOptions: {
          type: "extra-rounded"
        }
      })
      qrCode.append(qrRef.current)
    }
  }, [totpUri])

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey)
    toast.success("Secret key copied!")
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
      
      // Force a full page reload to refresh the session with AAL2
      window.location.href = "/admin"
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
                <div ref={qrRef} className="border-4 border-white shadow-sm rounded-lg p-2 bg-white" />
              </div>
              
              {secretKey && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Or enter this key manually:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                      {secretKey}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecretKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
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