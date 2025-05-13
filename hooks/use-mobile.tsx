"use client"

import { useState, useEffect } from "react"

interface MobileInfo {
  isMobile: boolean
  isSmallScreen: boolean
  isTouchDevice: boolean
  isLandscape: boolean
  isIOS: boolean
  isAndroid: boolean
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isSmallScreen: false,
    isTouchDevice: false,
    isLandscape: false,
    isIOS: false,
    isAndroid: false,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  useEffect(() => {
    const updateMobileInfo = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

      // 检测移动设备
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobile = mobileRegex.test(userAgent)

      // 检测屏幕尺寸
      const isSmallScreen = window.innerWidth < 768

      // 检测触摸设备
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0

      // 检测屏幕方向
      const isLandscape = window.innerWidth > window.innerHeight

      // 检测操作系统
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
      const isAndroid = /Android/.test(userAgent)

      // 获取安全区域
      const safeAreaInsets = {
        top: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0"),
        right: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sar") || "0"),
        bottom: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0"),
        left: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sal") || "0"),
      }

      setMobileInfo({
        isMobile,
        isSmallScreen,
        isTouchDevice,
        isLandscape,
        isIOS,
        isAndroid,
        safeAreaInsets,
      })
    }

    // 初始化CSS变量以获取安全区域
    const initSafeAreaVariables = () => {
      document.documentElement.style.setProperty("--sat", "env(safe-area-inset-top, 0px)")
      document.documentElement.style.setProperty("--sar", "env(safe-area-inset-right, 0px)")
      document.documentElement.style.setProperty("--sab", "env(safe-area-inset-bottom, 0px)")
      document.documentElement.style.setProperty("--sal", "env(safe-area-inset-left, 0px)")
    }

    initSafeAreaVariables()
    updateMobileInfo()

    // 监听窗口大小和方向变化
    window.addEventListener("resize", updateMobileInfo)
    window.addEventListener("orientationchange", updateMobileInfo)

    return () => {
      window.removeEventListener("resize", updateMobileInfo)
      window.removeEventListener("orientationchange", updateMobileInfo)
    }
  }, [])

  return mobileInfo
}
