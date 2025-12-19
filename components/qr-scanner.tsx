"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2, Camera } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const isRunningRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        isRunningRef.current = false
      } catch (e) {
        // Ignore stop errors
      }
    }
  }, [])

  const handleScan = useCallback(async (decodedText: string) => {
    console.log("QR Code scanned:", decodedText)
    await stopScanner()
    onScan(decodedText)
  }, [onScan, stopScanner])

  useEffect(() => {
    let mounted = true

    const initScanner = async () => {
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!mounted || !scannerRef.current) return
      if (html5QrCodeRef.current) return // Already initialized

      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        
        if (!mounted) return

        const scanner = new Html5Qrcode("qr-reader")
        html5QrCodeRef.current = scanner

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        }

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            if (mounted) handleScan(decodedText)
          },
          () => {} // Ignore continuous scan errors
        )
        
        if (mounted) {
          isRunningRef.current = true
          setScanning(true)
        }
      } catch (err: any) {
        console.error("Scanner error:", err)
        if (!mounted) return
        
        const msg = err.message || ""
        if (msg.includes("Permission")) {
          setError("Camera permission denied. Please allow camera access.")
        } else if (msg.includes("NotFoundError") || msg.includes("not found")) {
          setError("No camera found on this device.")
        } else if (msg.includes("already") || msg.includes("running")) {
          // Scanner already running, ignore
        } else {
          setError("Unable to start camera. Please try again.")
        }
      }
    }

    initScanner()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [handleScan, stopScanner])

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  const handleManualInput = async () => {
    const code = prompt("Enter the attendance code:")
    if (code) {
      await stopScanner()
      onScan(code)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-md rounded-lg bg-card p-4 mx-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 z-10" 
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h3 className="mb-4 text-center text-lg font-semibold">Scan QR Code</h3>
        
        {error ? (
          <div className="text-center py-8">
            <p className="mb-4 text-sm text-destructive">{error}</p>
            <Button onClick={handleManualInput}>Enter Code Manually</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-black">
              <div 
                id="qr-reader" 
                ref={scannerRef}
                className="w-full"
                style={{ minHeight: "300px" }}
              />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Position the QR code within the frame
              </p>
              <Button variant="outline" onClick={handleManualInput}>
                <Camera className="mr-2 h-4 w-4" />
                Enter Code Manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
