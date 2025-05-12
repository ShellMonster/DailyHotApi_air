/**
 * Safari 浏览器特定优化工具
 */

// 检测是否为Safari浏览器
function isSafari(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Android")
}

// 检测是否为iOS设备
function isIOS(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

// 添加一个新的工具函数，用于防止Safari上的重复刷新
export function preventSafariReloads() {
  if (!isSafari() && !isIOS()) return

  // 在Safari上，阻止某些可能导致重复加载的行为
  try {
    // 1. 防止bfcache导致的重复加载
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        // 页面从bfcache恢复，阻止自动刷新
        console.log("Page restored from bfcache, preventing reload")
        event.stopImmediatePropagation()
      }
    })

    // 2. 修复Safari上的history.pushState行为
    const originalPushState = history.pushState
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args)
      // 防止pushState触发不必要的重新加载
      window.dispatchEvent(new Event("pushstate"))
      return result
    }

    console.log("Safari reload prevention applied")
  } catch (e) {
    console.error("Error applying Safari reload prevention:", e)
  }
}
