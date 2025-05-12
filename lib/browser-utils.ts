/**
 * 浏览器检测和优化工具
 */

// 检测是否为Safari浏览器
export function isSafari(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Android")
}

// 检测是否为iOS设备
export function isIOS(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

// 应用Safari特定优化
export function applySafariOptimizations(): void {
  if (!isSafari() && !isIOS()) return

  // 添加Safari特定的CSS类到body
  document.body.classList.add("is-safari")

  // 减少同时进行的动画数量
  window.requestAnimationFrame(() => {
    const style = document.createElement("style")
    style.textContent = `
      /* 降低Safari上的动画复杂度 */
      .is-safari .animate-pulse {
        animation-duration: 3s !important;
      }
      .is-safari .animate-spin {
        animation-duration: 1.5s !important;
      }
      .is-safari .animate-fade-in-up {
        animation-duration: 0.3s !important;
        transform: translateZ(0);
      }
      /* 强制硬件加速 */
      .is-safari .card,
      .is-safari .motion-card,
      .is-safari .platform-card {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
        will-change: transform, opacity;
      }
      /* 优化Safari上的滚动 */
      .is-safari .scrollbar-thin {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: auto;
      }
      /* 减少模糊效果的使用，这在Safari上很耗性能 */
      .is-safari .backdrop-blur-sm {
        backdrop-filter: blur(4px);
      }
      /* 优化Safari上的渐变 */
      .is-safari .bg-gradient-to-r {
        background-attachment: scroll;
      }
    `
    document.head.appendChild(style)
  })

  // 减少IntersectionObserver的灵敏度
  window.SAFARI_OBSERVER_CONFIG = {
    rootMargin: "300px",
    threshold: 0.01,
  }

  console.log("Safari optimizations applied")
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
