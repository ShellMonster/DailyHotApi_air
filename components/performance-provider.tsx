"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { detectDevicePerformance, detectPerformanceFeatures } from "@/lib/performance-utils"
import { isSafari, isIOS } from "@/lib/browser-utils"
import { preventSafariReloads } from "@/lib/safari-utils"

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

// 根据设备性能调整应用配置
export function getPerformanceConfig() {
  const performanceLevel = detectDevicePerformance()
  const isSafariBrowser = isSafari()
  const isIOSDevice = isIOS()

  const config = {
    batchSize: 5,
    batchDelay: 300,
    animationDuration: 0.2,
    useHeavyAnimations: true,
    lazyLoadThreshold: 200,
    maxConcurrentRequests: 5,
  }

  // Safari特定优化
  if (isSafariBrowser || isIOSDevice) {
    return {
      ...config,
      batchSize: 2,
      batchDelay: 500,
      animationDuration: 0.1,
      useHeavyAnimations: false,
      lazyLoadThreshold: 300,
      maxConcurrentRequests: 2,
    }
  }

  if (performanceLevel === "low") {
    return {
      ...config,
      batchSize: 2,
      batchDelay: 500,
      animationDuration: 0.1,
      useHeavyAnimations: false,
      lazyLoadThreshold: 100,
      maxConcurrentRequests: 2,
    }
  } else if (performanceLevel === "medium") {
    return {
      ...config,
      batchSize: 3,
      batchDelay: 400,
      animationDuration: 0.15,
      useHeavyAnimations: true,
      lazyLoadThreshold: 150,
      maxConcurrentRequests: 3,
    }
  }

  return config
}

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

    // 防止Safari上的重复刷新
    if (isSafari() || isIOS()) {
      preventSafariReloads()
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
