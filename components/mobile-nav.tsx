"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, BarChart3, RefreshCw, Sun, Moon, ArrowUp } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

interface MobileNavProps {
  onSearch: () => void
  onAnalysis: () => void
  onRefresh: () => void
}

export function MobileNav({ onSearch, onAnalysis, onRefresh }: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const lastTapTimeRef = useRef(0)

  // 在组件挂载后设置mounted为true
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // 控制返回顶部按钮显示
      if (currentScrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }

      // 如果向上滚动或在页面顶部，显示导航栏
      if (currentScrollY <= 0 || currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      // 如果向下滚动超过20px，隐藏导航栏
      else if (currentScrollY > lastScrollY && currentScrollY > 20) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    // 初始显示导航栏
    setIsVisible(true)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [lastScrollY])

  // 返回顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })

    // 添加触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  // 双击刷新功能
  const handleDoubleTap = (callback: () => void) => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // 是双击
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }
      callback()
      lastTapTimeRef.current = 0
    } else {
      lastTapTimeRef.current = now
    }
  }

  // 只在小屏幕上显示
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t py-2 px-4 sm:hidden"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearch}
                className="flex flex-col items-center justify-center h-14 w-16 rounded-lg active:scale-95 transition-transform"
              >
                <Search className="h-5 w-5 mb-1" />
                <span className="text-[10px]">搜索</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onAnalysis}
                className="flex flex-col items-center justify-center h-14 w-16 rounded-lg active:scale-95 transition-transform"
              >
                <BarChart3 className="h-5 w-5 mb-1" />
                <span className="text-[10px]">分析</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDoubleTap(onRefresh)}
                className="flex flex-col items-center justify-center h-14 w-16 rounded-lg active:scale-95 transition-transform"
              >
                <RefreshCw className="h-5 w-5 mb-1" />
                <span className="text-[10px]">双击刷新</span>
              </Button>

              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex flex-col items-center justify-center h-14 w-16 rounded-lg active:scale-95 transition-transform"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-5 w-5 mb-1" />
                      <span className="text-[10px]">亮色</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5 mb-1" />
                      <span className="text-[10px]">暗色</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg z-50 active:scale-95 transition-transform"
            aria-label="返回顶部"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
