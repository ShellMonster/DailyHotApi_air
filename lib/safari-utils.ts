/**
 * Safari特定优化工具
 */

import { isSafari, isIOS } from "./browser-utils"

// 防止Safari上的重复刷新问题
export function preventSafariReloads(): void {
  if (!isSafari() && !isIOS()) return

  // 使用sessionStorage标记页面已加载，防止重复加载
  try {
    const hasLoaded = sessionStorage.getItem("pageLoaded")
    if (hasLoaded) {
      console.log("Page already loaded, preventing reload")
    } else {
      sessionStorage.setItem("pageLoaded", "true")

      // 添加时间戳，用于检测页面是否真的刷新了
      sessionStorage.setItem("loadTimestamp", Date.now().toString())
    }

    // 监听页面可见性变化，防止在标签页切换时重新加载
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("Page became visible, not triggering reload")
      }
    })

    // 防止bfcache导致的重新加载
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        console.log("Page was restored from bfcache, preventing reload")

        // 添加一个类，用于CSS中防止闪烁
        document.documentElement.classList.add("from-bfcache")
      }
    })

    // 修复Safari上的history.pushState行为
    const originalPushState = history.pushState
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args)
      window.dispatchEvent(new Event("pushstate"))
      window.dispatchEvent(new Event("locationchange"))
      return result
    }

    // 监听popstate事件
    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("locationchange"))
    })
  } catch (e) {
    console.error("Error in preventSafariReloads:", e)
  }
}

// 优化Safari上的动画性能
export function optimizeSafariAnimations(): void {
  if (!isSafari() && !isIOS()) return

  // 减少动画复杂度
  document.documentElement.style.setProperty("--animation-duration", "0.1s")

  // 禁用复杂动画
  const complexAnimations = document.querySelectorAll(".stagger-animation > *")
  complexAnimations.forEach((el) => {
    const element = el as HTMLElement
    element.style.animationDelay = "0s"
  })

  // 优化脉冲动画
  const pulseAnimations = document.querySelectorAll(".animate-pulse")
  pulseAnimations.forEach((el) => {
    const element = el as HTMLElement
    element.style.animationDuration = "3s"
  })

  // 优化旋转动画
  const spinAnimations = document.querySelectorAll(".animate-spin")
  spinAnimations.forEach((el) => {
    const element = el as HTMLElement
    element.style.animationDuration = "1.5s"
  })
}

// 优化Safari上的DOM操作
export function optimizeSafariDOM(): void {
  if (!isSafari() && !isIOS()) return

  // 减少重绘和重排
  const dynamicElements = document.querySelectorAll(".platform-grid")
  dynamicElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.contain = "content"
  })

  // 优化圆角元素
  const roundedElements = document.querySelectorAll(".rounded-full")
  roundedElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.transform = "translateZ(0)"
  })

  // 优化阴影
  const shadowElements = document.querySelectorAll(".shadow-lg")
  shadowElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  })
}

// 优化Safari上的资源加载
export function optimizeSafariResourceLoading(): void {
  if (!isSafari() && !isIOS()) return

  // 延迟加载非关键资源
  setTimeout(() => {
    // 预连接到API域名
    const link = document.createElement("link")
    link.rel = "preconnect"
    link.href = "https://dailyhotpage-lac.vercel.app"
    document.head.appendChild(link)

    // 添加DNS预取
    const dnsPrefetch = document.createElement("link")
    dnsPrefetch.rel = "dns-prefetch"
    dnsPrefetch.href = "https://dailyhotpage-lac.vercel.app"
    document.head.appendChild(dnsPrefetch)
  }, 300)
}

// 防止Safari闪烁
export function preventSafariFlicker(): void {
  if (!isSafari() && !isIOS()) return

  // 检查是否是首次加载
  const isFirstLoad = !sessionStorage.getItem("hasVisited")

  if (isFirstLoad) {
    // 首次加载时，添加一个类来控制过渡效果
    document.documentElement.classList.add("first-load")
    sessionStorage.setItem("hasVisited", "true")

    // 延迟移除类，允许页面稳定渲染
    setTimeout(() => {
      document.documentElement.classList.remove("first-load")
    }, 500)
  }

  // 添加CSS规则来防止闪烁
  const style = document.createElement("style")
  style.textContent = `
    .first-load * {
      animation-delay: 0.5s !important;
      transition: none !important;
    }
    .from-bfcache * {
      animation: none !important;
      transition: none !important;
    }
  `
  document.head.appendChild(style)
}
