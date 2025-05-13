"use client"

import { useState, useEffect } from "react"
import { Search, BarChart2, RefreshCw, Moon, Sun, ArrowUp } from "lucide-react"
import { useTheme } from "next-themes"

interface MobileNavProps {
  onSearch: () => void
  onAnalysis: () => void
  onRefresh: () => void
}

export function MobileNav({ onSearch, onAnalysis, onRefresh }: MobileNavProps) {
  const { theme, setTheme } = useTheme()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isNavVisible, setIsNavVisible] = useState(true)

  // 监听滚动事件，控制返回顶部按钮显示和导航栏的显示/隐藏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // 控制返回顶部按钮显示
      if (currentScrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }

      // 滚动方向检测，向下滚动时隐藏导航栏，向上滚动时显示
      if (currentScrollY > lastScrollY + 10) {
        setIsNavVisible(false)
      } else if (currentScrollY < lastScrollY - 10) {
        setIsNavVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // 返回顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <>
      {/* 底部导航栏 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background border-t z-50 transition-transform duration-300 ${
          isNavVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0.5rem)" }}
      >
        <div className="flex items-center justify-around h-14">
          <button
            onClick={onSearch}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary active:text-primary transition-colors"
            aria-label="搜索"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">搜索</span>
          </button>

          <button
            onClick={onAnalysis}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary active:text-primary transition-colors"
            aria-label="分析"
          >
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs mt-1">分析</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary active:text-primary transition-colors"
            aria-label="刷新"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="text-xs mt-1">刷新</span>
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary active:text-primary transition-colors"
            aria-label={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5" />
                <span className="text-xs mt-1">亮色</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                <span className="text-xs mt-1">暗色</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 返回顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 bg-primary text-primary-foreground rounded-full p-2 shadow-lg z-50 animate-fade-in touch-manipulation"
          aria-label="返回顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  )
}
