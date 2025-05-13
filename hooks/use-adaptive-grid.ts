"use client"

import { useState, useEffect } from "react"

// 定义每个卡片的固定宽度和间距
const CARD_WIDTH = 250 // 卡片的固定宽度（像素）
const CARD_GAP = 12 // 卡片之间的间距（像素）
const MIN_COLUMNS = 1 // 最小列数
const MAX_COLUMNS = 10 // 最大列数（增加到10，支持超宽屏幕）
const DEFAULT_COLUMNS = 5 // 默认列数（对应lg:grid-cols-5）
const MAX_WIDTH_PERCENTAGE = 90 // 最大宽度百分比

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
  const [containerWidth, setContainerWidth] = useState("auto")
  // 页面容器宽度状态
  const [pageContainerWidth, setPageContainerWidth] = useState("auto")
  // 是否是宽屏
  const [isWideScreen, setIsWideScreen] = useState(false)

  useEffect(() => {
    // 计算最佳列数的函数
    const calculateOptimalColumns = () => {
      // 获取视口宽度
      const viewportWidth = window.innerWidth

      // 确定是否是宽屏
      const wideScreen = viewportWidth > BREAKPOINTS.xl
      setIsWideScreen(wideScreen)

      // 计算最大可用宽度（视口宽度的90%）
      const maxAvailableWidth = viewportWidth * (MAX_WIDTH_PERCENTAGE / 100)

      // 计算一个内容块的总宽度（包括间距）
      const totalCardWidth = CARD_WIDTH + CARD_GAP

      // 计算在最大可用宽度内可以容纳的完整内容块数量（向下取整）
      // 注意：我们需要考虑最后一个内容块后面不需要间距
      // 公式: (maxAvailableWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)
      // 加上CARD_GAP是为了补偿最后一个卡片不需要右边距
      const maxPossibleColumns = Math.floor((maxAvailableWidth + CARD_GAP) / totalCardWidth)

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
      } else if (viewportWidth >= BREAKPOINTS["3xl"]) {
        // 对于超宽屏幕，确保至少有8列
        optimalColumns = Math.max(8, optimalColumns)
      } else if (viewportWidth >= BREAKPOINTS["2xl"]) {
        // 对于2倍超大屏幕，确保至少有7列
        optimalColumns = Math.max(7, optimalColumns)
      } else if (viewportWidth >= BREAKPOINTS.xl) {
        // 对于超大屏幕，确保至少有6列
        optimalColumns = Math.max(6, optimalColumns)
      }

      // 计算实际需要的容器宽度（精确容纳optimalColumns个内容块）
      // 最后一个内容块后面不需要间距，所以总宽度是：
      // (内容块数量 * 内容块宽度) + ((内容块数量 - 1) * 间距)
      const exactContainerWidth = optimalColumns * CARD_WIDTH + (optimalColumns - 1) * CARD_GAP

      // 确保容器宽度不超过最大可用宽度
      const finalContainerWidth = Math.min(exactContainerWidth, maxAvailableWidth)

      // 将容器宽度设置为精确值（以像素为单位）
      const containerWidthValue = `${finalContainerWidth}px`

      // 页面容器宽度略大一些，给整体添加一些边距
      const pageWidth = finalContainerWidth + 40 // 添加左右各20px的边距
      const pageContainerWidthValue = `${pageWidth}px`

      // 更新状态
      setColumns(optimalColumns)
      setContainerWidth(containerWidthValue)
      setPageContainerWidth(pageContainerWidthValue)
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

  return { columns, containerWidth, pageContainerWidth, isWideScreen }
}
