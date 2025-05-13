"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检查是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

      // 检查是否为移动设备的正则表达式
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

      // 检查屏幕宽度
      const isMobileWidth = window.innerWidth < 768

      setIsMobile(mobileRegex.test(userAgent) || isMobileWidth)
    }

    // 初始检查
    checkMobile()

    // 监听窗口大小变化
    window.addEventListener("resize", checkMobile)

    // 清理函数
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}
