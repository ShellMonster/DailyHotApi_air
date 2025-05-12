"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, BarChart3, RefreshCw, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

interface MobileNavProps {
  onSearch: () => void
  onAnalysis: () => void
  onRefresh: () => void
}

export function MobileNav({ onSearch, onAnalysis, onRefresh }: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 在组件挂载后设置mounted为true
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

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

  // 只在大屏幕上隐藏
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t py-2 px-4 sm:hidden"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearch}
              className="flex flex-col items-center justify-center h-12 w-16 rounded-lg"
            >
              <Search className="h-4 w-4 mb-1" />
              <span className="text-[10px]">搜索</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onAnalysis}
              className="flex flex-col items-center justify-center h-12 w-16 rounded-lg"
            >
              <BarChart3 className="h-4 w-4 mb-1" />
              <span className="text-[10px]">分析</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="flex flex-col items-center justify-center h-12 w-16 rounded-lg"
            >
              <RefreshCw className="h-4 w-4 mb-1" />
              <span className="text-[10px]">刷新</span>
            </Button>

            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex flex-col items-center justify-center h-12 w-16 rounded-lg"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mb-1" />
                    <span className="text-[10px]">亮色</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mb-1" />
                    <span className="text-[10px]">暗色</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
