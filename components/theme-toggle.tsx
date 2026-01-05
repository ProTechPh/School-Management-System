"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [isAnimating, setIsAnimating] = React.useState(false)

  const handleThemeChange = (newTheme: string) => {
    if (isAnimating) return
    
    // Determine what the actual theme will be
    const currentTheme = theme === "system" ? resolvedTheme : theme
    const targetTheme = newTheme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : newTheme
    
    if (currentTheme === targetTheme) return
    
    setIsAnimating(true)
    
    // Create ripple element with target theme color
    const ripple = document.createElement("div")
    ripple.className = `theme-ripple ${targetTheme}`
    document.body.appendChild(ripple)
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ripple.classList.add("active")
      })
    })
    
    // Change theme after ripple starts expanding
    setTimeout(() => {
      setTheme(newTheme)
    }, 600)
    
    // Remove ripple after animation completes
    setTimeout(() => {
      ripple.remove()
      setIsAnimating(false)
    }, 1200)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
