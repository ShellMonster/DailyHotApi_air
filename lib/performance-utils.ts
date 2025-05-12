/**
 * 性能优化工具函数
 */

// 防抖函数 - 用于减少频繁触发的事件
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数 - 用于限制函数调用频率
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// 检测浏览器是否支持某些性能优化特性
export function detectPerformanceFeatures(): Record<string, boolean> {
  return {
    intersectionObserver: "IntersectionObserver" in window,
    resizeObserver: "ResizeObserver" in window,
    mutationObserver: "MutationObserver" in window,
    requestIdleCallback: "requestIdleCallback" in window,
    passiveEvents: (() => {
      let supportsPassive = false
      try {
        // @ts-ignore - 测试浏览器是否支持passive选项
        const opts = Object.defineProperty({}, "passive", {
          get: () => {
            supportsPassive = true
            return true
          },
        })
        window.addEventListener("testPassive", null as any, opts)
        window.removeEventListener("testPassive", null as any, opts)
      } catch (e) {}
      return supportsPassive
    })(),
  }
}

// 延迟加载函数 - 用于非关键资源
export function lazyLoad(callback: () => void, delay = 1000): void {
  if ("requestIdleCallback" in window) {
    ;(window as any).requestIdleCallback(() => {
      setTimeout(callback, delay)
    })
  } else {
    setTimeout(callback, delay)
  }
}

// 批量处理函数 - 用于分批处理大量数据
export function processBatch<T, R>(items: T[], processFn: (item: T) => R, batchSize = 5, delay = 16): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = []
    let index = 0

    function processNextBatch() {
      const end = Math.min(index + batchSize, items.length)

      for (let i = index; i < end; i++) {
        results.push(processFn(items[i]))
      }

      index = end

      if (index < items.length) {
        setTimeout(processNextBatch, delay)
      } else {
        resolve(results)
      }
    }

    processNextBatch()
  })
}

// 检测设备性能
export function detectDevicePerformance(): "low" | "medium" | "high" {
  // 检测设备内存
  const memory = (navigator as any).deviceMemory || 4

  // 检测处理器核心数
  const cores = navigator.hardwareConcurrency || 4

  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile && (memory <= 2 || cores <= 4)) {
    return "low"
  } else if (memory >= 8 && cores >= 8) {
    return "high"
  } else {
    return "medium"
  }
}

// 根据设备性能调整应用配置
export function getPerformanceConfig() {
  const performanceLevel = detectDevicePerformance()

  const config = {
    batchSize: 5,
    batchDelay: 300,
    animationDuration: 0.2,
    useHeavyAnimations: true,
    lazyLoadThreshold: 200,
    maxConcurrentRequests: 5,
  }

  if (performanceLevel === "low") {
    return {
      ...config,
      batchSize: 2,
      batchDelay: 500,
      animationDuration: 0.1,
      useHeavyAnimations: false,
      lazyLoadThreshold: 100,
      maxConcurrentRequests: 2,
    }
  } else if (performanceLevel === "medium") {
    return {
      ...config,
      batchSize: 3,
      batchDelay: 400,
      animationDuration: 0.15,
      useHeavyAnimations: true,
      lazyLoadThreshold: 150,
      maxConcurrentRequests: 3,
    }
  }

  return config
}
