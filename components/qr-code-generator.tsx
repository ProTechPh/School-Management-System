"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"

interface QRCodeGeneratorProps {
  data: string
  size?: number
}

export function QRCodeGenerator({ data, size = 200 }: QRCodeGeneratorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: size,
        height: size,
        data,
        dotsOptions: {
          color: "#14b8a6",
          type: "rounded",
        },
        cornersSquareOptions: {
          color: "#0f766e",
          type: "extra-rounded",
        },
        cornersDotOptions: {
          color: "#0f766e",
          type: "dot",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
        },
      })
    }

    if (ref.current) {
      ref.current.innerHTML = ""
      qrCodeRef.current.append(ref.current)
    }
  }, [])

  useEffect(() => {
    if (qrCodeRef.current) {
      qrCodeRef.current.update({
        data,
      })
    }
  }, [data])

  return <div ref={ref} className="flex items-center justify-center rounded-lg bg-white p-4" />
}
