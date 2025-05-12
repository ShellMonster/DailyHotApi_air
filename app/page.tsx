"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import ErrorBoundary from "@/components/error-boundary"
import { applySafariRenderFix } from "@/lib/safari-render-fix"
import { isSafari } from "@/lib/browser-utils"

// 动态导入移动导航组件
const MobileNav = dynamic(() => import("@/components/mobile-nav").then((mod) => ({ default: mod.MobileNav })), {
  ssr: false,
})

// 动态导入PlatformGrid组件，使用自定义加载组件
const PlatformGrid = dynamic(
  () =>
    import("@/components/platform-grid")
      .then((mod) => {
        console.log("PlatformGrid component loaded successfully")
        return { default: mod.default }
      })
      .catch((err) => {
        console.error("Error loading PlatformGrid:", err)
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
    loading: () => <SafariOptimizedLoading />,
    ssr: false, // 禁用SSR，避免水合不匹配问题
  },
)

// 为Safari优化的加载组件
function SafariOptimizedLoading() {
  const isSafariBrowser = typeof window !== "undefined" ? isSafari() : false

  // 在Safari上使用更简单的加载指示器
  if (isSafariBrowser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 safari-render-fix">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">正在加载热榜数据...</p>
      </div>
    )
  }

  // 其他浏览器使用正常的加载指示器
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      <p className="text-muted-foreground">正在加载热榜数据...</p>
      <p className="text-xs text-muted-foreground">首次加载可能需要几秒钟</p>
    </div>
  )
}

export default function Home() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)

  // 用于跟踪Safari渲染修复是否已应用
  const safariFixApplied = useRef(false)

  // 处理刷新操作
  const handleRefresh = () => {
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

  // 应用Safari渲染修复
  useEffect(() => {
    // 确保只应用一次
    if (!safariFixApplied.current) {
      safariFixApplied.current = true

      // 应用Safari渲染修复
      applySafariRenderFix()

      // 添加页面可见性变化监听器，防止在标签页切换时重新加载
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          console.log("Page became visible, applying Safari fix again")
          applySafariRenderFix()
        }
      })
    }
  }, [])

  // 优化页面组件，提高响应速度
  useEffect(() => {
    // 添加预加载API域名的逻辑，提前建立连接
    const preloadResources = () => {
      // 预连接到API域名
      const link = document.createElement("link")
      link.rel = "preconnect"
      link.href = "https://api-hot.imsyy.top"
      document.head.appendChild(link)

      // 添加DNS预取
      const dnsPrefetch = document.createElement("link")
      dnsPrefetch.rel = "dns-prefetch"
      dnsPrefetch.href = "https://api-hot.imsyy.top"
      document.head.appendChild(dnsPrefetch)
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
