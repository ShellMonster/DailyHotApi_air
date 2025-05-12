/**
 * Hover状态管理工具
 */

import { isSafari } from "./browser-utils"

// 防抖函数 - 用于hover事件
export function debounceHover<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// 获取适合当前浏览器的hover延迟时间
export function getHoverDelay(defaultDelay = 200): number {
  // Safari浏览器使用更短的延迟时间
  return isSafari() ? Math.max(50, defaultDelay / 2) : defaultDelay
}

// 计算悬浮框的最佳位置
export function calculateHoverPosition(
  element: HTMLElement,
  previewWidth = 300,
  previewHeight = 150,
): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  // 计算最佳的Y位置
  let yPosition

  // 检查元素是否在视口下半部分
  if (rect.bottom > viewportHeight / 2) {
    // 如果在下半部分，显示在元素上方
    yPosition = rect.top - previewHeight - 10
  } else {
    // 如果在上半部分，显示在元素下方
    yPosition = rect.bottom + 10
  }

  // 确保Y位置不会超出视口
  if (yPosition < 10) {
    yPosition = 10 // 顶部边距
  } else if (yPosition + previewHeight > viewportHeight - 10) {
    yPosition = viewportHeight - previewHeight - 10 // 底部边距
  }

  // 确保X位置不会超出视口
  let xPosition = rect.left
  if (xPosition + previewWidth > viewportWidth - 10) {
    xPosition = viewportWidth - previewWidth - 10
  }
  if (xPosition < 10) {
    xPosition = 10
  }

  return {
    x: xPosition + window.scrollX,
    y: yPosition + window.scrollY,
  }
}

// 创建一个hover管理器
export function createHoverManager() {
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null

  return {
    startHover: (callback: () => void, delay = 200) => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(callback, getHoverDelay(delay))
    },

    endHover: (callback: () => void, delay = 50) => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(callback, getHoverDelay(delay))
    },

    clearHover: () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
        hoverTimeout = null
      }
    },
  }
}
