"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { detectDevicePerformance, getPerformanceConfig, detectPerformanceFeatures } from "@/lib/performance-utils"

// 定义性能配置类型
type PerformanceConfig = {
  batchSize: number
  batchDelay: number
  animationDuration: number
  useHeavyAnimations: boolean
  lazyLoadThreshold: number
  maxConcurrentRequests: number
  devicePerformance: "low" | "medium" | "high"
  features: Record<string, boolean>
}

// 创建上下文
const PerformanceContext = createContext<PerformanceConfig | null>(null)

// 性能提供者组件
export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PerformanceConfig>({
    ...getPerformanceConfig(),
    devicePerformance: "medium",
    features: {},
  })

  useEffect(() => {
    // 检测设备性能并设置配置
    const devicePerformance = detectDevicePerformance()
    const performanceConfig = getPerformanceConfig()
    const features = detectPerformanceFeatures()

    // 应用性能优化
    if (features.passiveEvents) {
      // 使用被动事件监听器优化滚动性能
      document.addEventListener("touchstart", () => {}, { passive: true })
      document.addEventListener("touchmove", () => {}, { passive: true })
      document.addEventListener("wheel", () => {}, { passive: true })
    }

    // 根据设备性能调整CSS变量
    document.documentElement.style.setProperty("--animation-duration", `${performanceConfig.animationDuration}s`)

    // 低性能设备禁用某些动画
    if (devicePerformance === "low") {
      document.documentElement.classList.add("reduce-motion")
    }

    setConfig({
      ...performanceConfig,
      devicePerformance,
      features,
    })

    console.log(`Device performance: ${devicePerformance}`, performanceConfig)

    return () => {
      // 清理事件监听器
      if (features.passiveEvents) {
        document.removeEventListener("touchstart", () => {})
        document.removeEventListener("touchmove", () => {})
        document.removeEventListener("wheel", () => {})
      }
    }
  }, [])

  return <PerformanceContext.Provider value={config}>{children}</PerformanceContext.Provider>
}

// 使用性能配置的钩子
export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error("usePerformance must be used within a PerformanceProvider")
  }
  return context
}
