"use client"
import { cn } from "@/lib/utils"

interface ProgressiveBlurProps {
  direction: "left" | "right" | "top" | "bottom"
  className?: string
  blurIntensity?: number
}

export function ProgressiveBlur({ direction, className, blurIntensity = 10 }: ProgressiveBlurProps) {
  const getGradient = () => {
    switch (direction) {
      case "left":
        return `linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 100%)`
      case "right":
        return `linear-gradient(to left, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 100%)`
      case "top":
        return `linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 100%)`
      case "bottom":
        return `linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 100%)`
      default:
        return ""
    }
  }

  return (
    <div
      className={cn("backdrop-blur-sm", className)}
      style={{
        background: getGradient(),
        backdropFilter: `blur(${blurIntensity}px)`,
      }}
    />
  )
}
