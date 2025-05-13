"use client"

import { useState, useEffect, useCallback } from "react"

// 卡片的固定宽度（像素）
const CARD_WIDTH = 240
// 卡片之间的间距（像素）
const CARD_GAP = 12
// 容器左右边距（像素）
const CONTAINER_PADDING = 16 * 2

// 最小和最大列数限制
const MIN_COLUMNS = 1
const MAX_COLUMNS = 8

export function useResponsiveLayout() {
  const [columns, setColumns] = useState(3)
  const [containerWidth, setContainerWidth] = useState(0)

  // 计算最佳列数的函数
  const calculateColumns = useCallback((width: number) => {
    // 可用宽度 = 容器宽度 - 容器内边距
    const availableWidth = width - CONTAINER_PADDING

    // 计算可以容纳的最大列数（包括间距）
    // 每个卡片占用的总宽度 = 卡片宽度 + 间距
    const maxColumns = Math.floor((availableWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP))

    // 确保列数在最小和最大范围内
    return Math.max(MIN_COLUMNS, Math.min(maxColumns, MAX_COLUMNS))
  }, [])

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    // 获取主内容区域的宽度（如果有特定容器，可以改为获取容器宽度）
    const mainElement = document.querySelector("main")
    const width = mainElement ? mainElement.clientWidth : window.innerWidth

    setContainerWidth(width)
    setColumns(calculateColumns(width))
  }, [calculateColumns])

  // 初始化和监听窗口大小变化
  useEffect(() => {
    // 初始计算
    handleResize()

    // 添加窗口大小变化监听
    window.addEventListener("resize", handleResize)

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [handleResize])

  // 返回计算出的列数和容器宽度
  return {
    columns,
    containerWidth,
    cardWidth: CARD_WIDTH,
    cardGap: CARD_GAP,
  }
}
