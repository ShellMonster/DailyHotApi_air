// 调试工具，用于在开发环境中输出元素的实际宽度
export function measureElementWidth(element: HTMLElement | null): number {
  if (!element) return 0

  const styles = window.getComputedStyle(element)
  const width = element.getBoundingClientRect().width
  const paddingLeft = Number.parseFloat(styles.paddingLeft)
  const paddingRight = Number.parseFloat(styles.paddingRight)

  // 返回内容区域宽度（不包括内边距）
  return width - paddingLeft - paddingRight
}

// 在开发环境中输出元素宽度
export function logElementWidth(element: HTMLElement | null, label = "Element"): void {
  if (process.env.NODE_ENV !== "development") return

  if (!element) {
    console.log(`${label}: Element not found`)
    return
  }

  const width = measureElementWidth(element)
  console.log(`${label} width: ${width}px`)
}

// 添加参考标记到元素，用于测量
export function addReferenceMarker(element: HTMLElement | null): void {
  if (!element || process.env.NODE_ENV !== "development") return

  const marker = document.createElement("div")
  marker.style.position = "absolute"
  marker.style.top = "0"
  marker.style.left = "0"
  marker.style.width = "250px"
  marker.style.height = "2px"
  marker.style.backgroundColor = "red"
  marker.style.zIndex = "1000"
  marker.style.opacity = "0.5"
  marker.style.pointerEvents = "none"

  element.style.position = "relative"
  element.appendChild(marker)
}
