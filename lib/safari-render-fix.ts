/**
 * Safari专用渲染修复
 * 这个文件包含了专门针对Safari浏览器的渲染优化
 */

import { isSafari, isIOS } from "./browser-utils"

// 检测是否为Safari浏览器
const IS_SAFARI = typeof window !== "undefined" ? isSafari() || isIOS() : false

// 应用Safari渲染修复
export function applySafariRenderFix() {
  if (!IS_SAFARI) return

  // 已经应用过修复，不重复执行
  if (window.__SAFARI_RENDER_FIXED__) return

  // 标记已应用修复
  window.__SAFARI_RENDER_FIXED__ = true

  console.log("Applying Safari render fix")

  // 1. 添加Safari特定类
  document.documentElement.classList.add("is-safari")

  // 2. 禁用所有动画直到页面完全加载
  const styleEl = document.createElement("style")
  styleEl.textContent = `
    * {
      animation: none !important;
      transition: none !important;
    }
  `
  document.head.appendChild(styleEl)

  // 3. 强制重绘以避免闪烁
  document.body.style.display = "none"

  // 4. 使用requestAnimationFrame确保在下一帧渲染前移除样式
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // 移除禁用动画的样式
      document.head.removeChild(styleEl)

      // 恢复显示
      document.body.style.display = ""

      // 添加平滑过渡类
      document.documentElement.classList.add("safari-loaded")

      console.log("Safari render fix applied")
    })
  })

  // 5. 禁用不必要的动画
  disableSafariAnimations()

  // 6. 应用内存优化
  applySafariMemoryOptimizations()
}

// 禁用Safari上的不必要动画
function disableSafariAnimations() {
  // 禁用交错动画
  const staggerElements = document.querySelectorAll(".stagger-animation > *")
  staggerElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.animationDelay = "0s"
    }
  })

  // 简化脉冲动画
  const pulseElements = document.querySelectorAll(".animate-pulse")
  pulseElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.animationDuration = "3s"
    }
  })

  // 禁用淡入上移动画，改为简单淡入
  const fadeInUpElements = document.querySelectorAll(".animate-fade-in-up")
  fadeInUpElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.classList.remove("animate-fade-in-up")
      el.classList.add("animate-fade-in")
    }
  })
}

// 应用Safari内存优化
function applySafariMemoryOptimizations() {
  // 减少DOM复杂度
  const complexElements = document.querySelectorAll(".platform-grid, .stagger-animation")
  complexElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.contain = "content"
    }
  })

  // 强制硬件加速关键元素
  const acceleratedElements = document.querySelectorAll(".card, .platform-card")
  acceleratedElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.transform = "translateZ(0)"
      el.style.backfaceVisibility = "hidden"
      el.style.perspective = "1000px"
    }
  })
}

// 声明全局变量类型
declare global {
  interface Window {
    __SAFARI_RENDER_FIXED__?: boolean
  }
}
