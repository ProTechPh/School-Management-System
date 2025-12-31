"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection...")
    setDetails(null)

    try {
      const supabase = createClient()
      
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error("Missing Supabase environment variables")
      }

      // Test 2: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.warn("Session error (might be okay if just not logged in):", sessionError)
      }

      // Test 3: Database query (count classes)
      const { count, error: countError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        // If table doesn't exist or RLS blocks it, try a simpler check or report specific error
        throw countError
      }

      setStatus("success")
      setMessage("Supabase connection successful!")
      setDetails({
        urlConfigured: !!url,
        keyConfigured: !!key,
        sessionStatus: session ? "Active" : "No active session",
        databaseAccess: "OK",
        classesCount: count
      })

    } catch (error: any) {
      console.error("Supabase test error:", error)
      setStatus("error")
      setMessage(error.message || "Failed to connect to Supabase")
      setDetails({
        errorName: error.name,
        errorMessage: error.message,
        hint: error.hint
      })
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-8 w-8 text-green-500" />}
            {status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
            
            <div>
              <p className="font-medium">
                {status === "loading" && "Testing connection..."}
                {status === "success" && "Connected"}
                {status === "error" && "Connection Failed"}
              </p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>

          {details && (
            <div className="rounded-md bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Details:</p>
              <pre className="w-full overflow-auto whitespace-pre-wrap text-xs font-mono">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={testConnection}
              disabled={status === "loading"}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
              Retry Test
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}