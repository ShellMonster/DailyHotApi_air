"use client"

import { useState, useEffect } from "react"

// 定义每个卡片的固定宽度和间距
const CARD_WIDTH = 240 // 卡片的固定宽度（像素）
const CARD_GAP = 12 // 卡片之间的间距（像素）
const MIN_COLUMNS = 1 // 最小列数
const MAX_COLUMNS = 8 // 最大列数
const DEFAULT_COLUMNS = 5 // 默认列数（对应lg:grid-cols-5）

// 定义屏幕断点
const BREAKPOINTS = {
  xs: 480, // 超小屏幕
  sm: 640, // 小屏幕
  md: 768, // 中等屏幕
  lg: 1024, // 大屏幕
  xl: 1280, // 超大屏幕
  "2xl": 1536, // 2倍超大屏幕
  "3xl": 1920, // 3倍超大屏幕
  "4xl": 2560, // 4倍超大屏幕
}

export function useAdaptiveGrid() {
  // 初始状态设置为默认列数
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  // 容器宽度状态
  const [containerWidth, setContainerWidth] = useState("100%")

  useEffect(() => {
    // 计算最佳列数的函数
    const calculateOptimalColumns = () => {
      // 获取视口宽度
      const viewportWidth = window.innerWidth

      // 计算内容区域宽度（考虑页面边距）
      const contentWidth = viewportWidth * 0.95 // 假设内容区域占视口的95%

      // 计算可以容纳的最大列数
      const maxPossibleColumns = Math.floor((contentWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP))

      // 确保列数在合理范围内
      let optimalColumns = Math.max(MIN_COLUMNS, Math.min(maxPossibleColumns, MAX_COLUMNS))

      // 根据断点调整列数
      if (viewportWidth < BREAKPOINTS.xs) {
        optimalColumns = 1
      } else if (viewportWidth < BREAKPOINTS.sm) {
        optimalColumns = Math.min(optimalColumns, 2)
      } else if (viewportWidth < BREAKPOINTS.md) {
        optimalColumns = Math.min(optimalColumns, 3)
      } else if (viewportWidth < BREAKPOINTS.lg) {
        optimalColumns = Math.min(optimalColumns, 4)
      }

      // 计算容器宽度
      const totalWidth = optimalColumns * CARD_WIDTH + (optimalColumns - 1) * CARD_GAP
      const containerWidthValue = `${totalWidth}px`

      // 更新状态
      setColumns(optimalColumns)
      setContainerWidth(containerWidthValue)
    }

    // 初始计算
    calculateOptimalColumns()

    // 监听窗口大小变化
    const handleResize = () => {
      calculateOptimalColumns()
    }

    window.addEventListener("resize", handleResize)

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return { columns, containerWidth }
}
