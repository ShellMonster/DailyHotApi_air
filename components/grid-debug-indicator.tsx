"use client"

import { useResponsiveGrid } from "@/hooks/use-responsive-grid"
import { useState, useEffect } from "react"

export function GridDebugIndicator() {
  const grid = useResponsiveGrid()
  const [isVisible, setIsVisible] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // 只在开发环境中显示
    setIsDev(process.env.NODE_ENV === "development")

    // 检查是否有调试参数
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has("debug") || urlParams.has("grid-debug")) {
      setIsVisible(true)
    }
  }, [])

  if (!isDev || !isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded-md text-xs z-50 font-mono">
      <div>Breakpoint: {grid.currentBreakpoint}</div>
      <div>Columns: {grid.columns}</div>
      <div>Width: {typeof window !== "undefined" ? window.innerWidth : "N/A"}px</div>
      <button
        onClick={() => setIsVisible(false)}
        className="mt-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-[10px] w-full"
      >
        Hide
      </button>
    </div>
  )
}
