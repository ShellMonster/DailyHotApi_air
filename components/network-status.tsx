"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // 初始化网络状态
    setIsOnline(navigator.onLine)

    // 监听网络状态变化
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      // 3秒后隐藏状态提示
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-2 text-sm font-medium text-center transition-all duration-300 ${
        isOnline ? "bg-green-500 text-white animate-fade-in" : "bg-red-500 text-white animate-fade-in"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>网络已恢复</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>网络连接已断开，正在使用缓存数据</span>
          </>
        )}
      </div>
    </div>
  )
}
