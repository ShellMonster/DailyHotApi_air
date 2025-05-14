"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"

interface CategoryItem {
  id: string | null
  name: string
  icon?: React.ComponentType<{ className?: string }>
  count: number
}

interface CategoryNavigationProps {
  categories: CategoryItem[]
  activeCategory: string | null
  onSelectCategory: (id: string | null) => void
}

export function CategoryNavigation({ categories, activeCategory, onSelectCategory }: CategoryNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const { isMobile } = useMobile()

  // 检查是否需要显示滚动箭头
  const checkScrollArrows = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 0)
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener("scroll", checkScrollArrows)
    window.addEventListener("resize", checkScrollArrows)

    // 初始检查
    checkScrollArrows()

    return () => {
      container.removeEventListener("scroll", checkScrollArrows)
      window.removeEventListener("resize", checkScrollArrows)
    }
  }, [categories])

  // 滚动到活动分类
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const activeElement = container.querySelector(`[data-category="${activeCategory || "all"}"]`)
    if (activeElement) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = activeElement.getBoundingClientRect()

      // 计算滚动位置，使活动元素居中
      const scrollLeft = elementRect.left - containerRect.left - containerRect.width / 2 + elementRect.width / 2

      container.scrollTo({
        left: container.scrollLeft + scrollLeft,
        behavior: "smooth",
      })
    }
  }, [activeCategory])

  // 滚动处理函数
  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.6
    const newScrollLeft =
      direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative mb-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {/* 移动端使用多行布局 */}
      {isMobile ? (
        <div className="flex flex-wrap gap-2 justify-start">
          {categories.map((item) => (
            <button
              key={item.id || "all"}
              data-category={item.id || "all"}
              onClick={() => onSelectCategory(item.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all touch-manipulation ${
                activeCategory === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 hover:bg-muted"
              }`}
              style={{ minWidth: "fit-content" }} // 根据文字长度自适应宽度
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.name} <span className="text-[10px] opacity-70">({item.count})</span>
            </button>
          ))}
        </div>
      ) : (
        // 桌面端使用可滚动布局
        <div className="relative">
          {showLeftArrow && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => handleScroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-thin pb-1 scroll-smooth"
            style={{
              maskImage:
                showLeftArrow || showRightArrow
                  ? "linear-gradient(to right, transparent, black 5%, black 95%, transparent)"
                  : "none",
            }}
          >
            <div className="inline-flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto max-w-full">
              {categories.map((item) => (
                <button
                  key={item.id || "all"}
                  data-category={item.id || "all"}
                  onClick={() => onSelectCategory(item.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                    activeCategory === item.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  }`}
                >
                  {item.icon && <item.icon className="h-3 w-3" />}
                  {item.name} <span className="text-[10px] opacity-70">({item.count})</span>
                </button>
              ))}
            </div>
          </div>

          {showRightArrow && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => handleScroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
