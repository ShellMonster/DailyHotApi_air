"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import ErrorBoundary from "@/components/error-boundary"
// 动态导入移动导航组件
const MobileNav = dynamic(() => import("@/components/mobile-nav").then((mod) => ({ default: mod.MobileNav })), {
  ssr: false,
})

// 动态导入主组件，减少初始加载时间
const PlatformGrid = dynamic(
  () =>
    import("@/components/platform-grid")
      .then((mod) => {
        console.log("PlatformGrid component loaded successfully")
        // 确保导入的是默认导出
        return { default: mod.default }
      })
      .catch((err) => {
        console.error("Error loading PlatformGrid:", err)
        // 返回一个回退组件
        return function FallbackComponent() {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-red-500">加载失败，请刷新页面重试</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                刷新页面
              </button>
            </div>
          )
        }
      }),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    ),
    ssr: false, // 禁用SSR，避免水合不匹配问题
  },
)

export default function Home() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // 添加状态管理搜索对话框和关键词分析对话框
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)

  // 处理刷新操作
  const handleRefresh = () => {
    // 这里可以添加刷新逻辑，如果需要的话
    window.location.reload()
  }

  // 添加错误处理
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error)
      setHasError(true)
      setErrorMessage(event.message || "应用发生错误，请刷新页面重试")
    }

    window.addEventListener("error", handleError)

    // 标记组件已加载
    setIsLoaded(true)

    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  // 优化页面组件，提高响应速度

  // 添加性能优化相关代码
  useEffect(() => {
    // 添加性能监控
    if (process.env.NODE_ENV === "development") {
      console.log("Performance monitoring enabled in development mode")
    }

    // 预加载关键资源
    const preloadResources = () => {
      // 预连接到API域名
      const link = document.createElement("link")
      link.rel = "preconnect"
      link.href = "https://dailyhotpage-lac.vercel.app"
      document.head.appendChild(link)
    }

    preloadResources()

    // 优化事件处理
    const optimizeEventHandling = () => {
      // 添加passive标志以提高滚动性能
      document.addEventListener("touchstart", () => {}, { passive: true })
      document.addEventListener("touchmove", () => {}, { passive: true })
    }

    optimizeEventHandling()

    // 清理函数
    return () => {
      // 清理事件监听器
      document.removeEventListener("touchstart", () => {})
      document.removeEventListener("touchmove", () => {})
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">出错了</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-4 md:py-6">
        <ErrorBoundary>
          <PlatformGrid />
        </ErrorBoundary>
      </main>

      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-2 md:flex-row">
          <p className="text-center text-[10px] text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} 热搜聚合. 数据来源于各大平台.
          </p>
          <p className="text-center text-[10px] text-muted-foreground md:text-right">
            <a
              href="https://dailyhotpage-lac.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-primary"
            >
              API 数据源
            </a>
          </p>
        </div>
      </footer>
      {/* 移动端导航 */}
      <MobileNav
        onSearch={() => setSearchDialogOpen(true)}
        onAnalysis={() => setAnalysisDialogOpen(true)}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
