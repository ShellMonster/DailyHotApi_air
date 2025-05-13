"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import ErrorBoundary from "@/components/error-boundary"
import { useAdaptiveGrid } from "@/hooks/use-adaptive-grid"
import { useMobile } from "@/hooks/use-mobile"
import { useSwipe } from "@/hooks/use-swipe"

// 动态导入组件
const MobileNav = dynamic(() => import("@/components/mobile-nav").then((mod) => ({ default: mod.MobileNav })), {
  ssr: false,
})

const NetworkStatus = dynamic(
  () => import("@/components/network-status").then((mod) => ({ default: mod.NetworkStatus })),
  {
    ssr: false,
  },
)

// 优化页面加载逻辑
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
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground">正在加载热榜数据...</p>
        <p className="text-xs text-muted-foreground">首次加载可能需要几秒钟</p>
      </div>
    ),
    ssr: false,
  },
)

export default function Home() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const { pageContainerWidth } = useAdaptiveGrid()
  const { isMobile, isSmallScreen, isTouchDevice } = useMobile()
  const mainRef = useRef<HTMLDivElement>(null)

  // 添加状态管理
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  // 处理刷新操作
  const handleRefresh = () => {
    // 添加触觉反馈（如果支持）
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // 记录刷新时间
    setLastRefreshTime(new Date())

    // 刷新页面
    window.location.reload()
  }

  // 添加手势支持
  const swipeHandlers = useSwipe({
    onSwipeDown: () => {
      // 只有在页面顶部时才触发下拉刷新
      if (window.scrollY < 10) {
        handleRefresh()
      }
    },
    threshold: 80,
  })

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

    // 添加下拉刷新提示
    if (isTouchDevice) {
      const touchStartY = { current: 0 }
      const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
      }

      document.addEventListener("touchstart", handleTouchStart, { passive: true })

      return () => {
        window.removeEventListener("error", handleError)
        document.removeEventListener("touchstart", handleTouchStart)
      }
    }

    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [isTouchDevice])

  // 性能优化
  useEffect(() => {
    // 预连接到API域名
    const preloadResources = () => {
      const link = document.createElement("link")
      link.rel = "preconnect"
      link.href = "https://api-hot.imsyy.top"
      document.head.appendChild(link)

      const dnsPrefetch = document.createElement("link")
      dnsPrefetch.rel = "dns-prefetch"
      dnsPrefetch.href = "https://api-hot.imsyy.top"
      document.head.appendChild(dnsPrefetch)
    }

    preloadResources()

    // 优化事件处理
    const optimizeEventHandling = () => {
      document.addEventListener("touchstart", () => {}, { passive: true })
      document.addEventListener("touchmove", () => {}, { passive: true })
    }

    optimizeEventHandling()

    // 添加离线支持
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("ServiceWorker registration successful with scope: ", registration.scope)
          },
          (err) => {
            console.log("ServiceWorker registration failed: ", err)
          },
        )
      })
    }

    return () => {
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
    <div className="min-h-screen bg-background" {...(isTouchDevice ? swipeHandlers : {})} ref={mainRef}>
      {/* 网络状态提示 */}
      <NetworkStatus />

      {/* 下拉刷新提示 - 仅在移动设备上显示 */}
      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-40 bg-primary text-primary-foreground text-center text-sm py-1 transform -translate-y-full transition-transform duration-300"
          style={{
            transform: window.scrollY < 10 ? "translateY(0)" : "translateY(-100%)",
          }}
        >
          下拉刷新
        </div>
      )}

      <main style={{ width: pageContainerWidth, margin: "0 auto", transition: "width 0.3s ease" }}>
        <div className="py-4 md:py-6">
          <ErrorBoundary>
            <PlatformGrid
              isMobile={isMobile}
              searchDialogOpen={searchDialogOpen}
              setSearchDialogOpen={setSearchDialogOpen}
              analysisDialogOpen={analysisDialogOpen}
              setAnalysisDialogOpen={setAnalysisDialogOpen}
            />
          </ErrorBoundary>
        </div>
      </main>

      <footer className="border-t py-4 mb-16 md:mb-0">
        <div style={{ width: pageContainerWidth, margin: "0 auto", transition: "width 0.3s ease" }} className="px-4">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
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
          {lastRefreshTime && (
            <p className="text-center text-[10px] text-muted-foreground mt-1">
              最后更新: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}
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
