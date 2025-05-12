/**
 * 浏览器工具函数
 */

// 检测是否为Safari浏览器
export function isSafari(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return /^((?!chrome|android).)*safari/i.test(ua) || (/iPad|iPhone|iPod/.test(ua) && !window.MSStream)
}

// 检测是否为iOS设备
export function isIOS(): boolean {
  if (typeof window === "undefined") return false

  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream
}

// 应用Safari特定优化
export function applySafariOptimizations(): void {
  if (!isSafari() && !isIOS()) return

  // 添加Safari特定的类
  document.documentElement.classList.add("is-safari")

  // 减少动画持续时间
  document.documentElement.style.setProperty("--animation-duration", "0.1s")

  // 强制硬件加速关键元素
  const acceleratedElements = document.querySelectorAll(".card, .motion-card, .platform-card")
  acceleratedElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.transform = "translateZ(0)"
    element.style.backfaceVisibility = "hidden"
    element.style.perspective = "1000px"
    element.style.willChange = "transform, opacity"
  })

  // 优化滚动
  const scrollableElements = document.querySelectorAll(".scrollbar-thin")
  scrollableElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.webkitOverflowScrolling = "touch"
    element.style.scrollBehavior = "auto"
  })

  // 减少模糊效果
  const blurElements = document.querySelectorAll(".backdrop-blur-sm")
  blurElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.backdropFilter = "blur(4px)"
  })

  // 优化渐变
  const gradientElements = document.querySelectorAll(".bg-gradient-to-r")
  gradientElements.forEach((el) => {
    const element = el as HTMLElement
    element.style.backgroundAttachment = "scroll"
  })
}

// 优化Safari上的图片加载
export function optimizeSafariImageLoading(): void {
  if (!isSafari() && !isIOS()) return

  // 延迟加载非关键图片
  const images = Array.from(document.querySelectorAll('img:not([loading="eager"])'))
  images.forEach((img) => {
    img.setAttribute("loading", "lazy")

    // 添加尺寸属性以减少布局偏移
    if (!img.hasAttribute("width") && !img.hasAttribute("height")) {
      img.setAttribute("width", "100")
      img.setAttribute("height", "100")
    }
  })
}

// 优化Safari上的事件处理
export function optimizeSafariEvents(): void {
  if (!isSafari() && !isIOS()) return

  // 使用被动事件监听器
  document.addEventListener("touchstart", () => {}, { passive: true })
  document.addEventListener("touchmove", () => {}, { passive: true })
  document.addEventListener("wheel", () => {}, { passive: true })

  // 减少滚动事件触发频率
  let ticking = false
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 在这里处理滚动事件
          ticking = false
        })
        ticking = true
      }
    },
    { passive: true },
  )
}
