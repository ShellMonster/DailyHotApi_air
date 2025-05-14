"use client"

import { useState, useEffect, useRef } from "react"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  pullDownThreshold?: number
  maxPullDownDistance?: number
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let touchStartY = 0
    let touchMoveY = 0

    const handleTouchStart = (e: TouchEvent) => {
      // 只有在页面顶部时才允许下拉刷新
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY
        startYRef.current = touchStartY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      touchMoveY = e.touches[0].clientY
      const pullDistance = Math.max(0, Math.min(touchMoveY - startYRef.current, maxPullDownDistance))

      if (window.scrollY === 0 && pullDistance > 0) {
        // 防止页面滚动
        e.preventDefault()
        setPullDistance(pullDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullDistance >= pullDownThreshold) {
        // 触发刷新
        setIsRefreshing(true)

        // 添加触觉反馈
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        try {
          await onRefresh()
        } catch (error) {
          console.error("Refresh failed:", error)
        } finally {
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
      setIsPulling(false)
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullDistance, onRefresh, pullDownThreshold, maxPullDownDistance])

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
  }
}
