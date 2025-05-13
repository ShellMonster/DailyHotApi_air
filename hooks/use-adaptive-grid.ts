"use client"

import { useState, useEffect } from "react"

export function useAdaptiveGrid() {
  // 内容块的固定宽度为270px（从250px修改）
  const CONTENT_BLOCK_WIDTH = 270
  // 内容块之间的间距
  const GAP_WIDTH = 12
  // 默认列数
  const DEFAULT_COLUMNS = 5

  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [containerWidth, setContainerWidth] = useState("90%")
  const [pageContainerWidth, setPageContainerWidth] = useState("90%")
  const [isWideScreen, setIsWideScreen] = useState(false)

  useEffect(() => {
    // 计算每行可以容纳多少个内容块
    const calculateColumns = () => {
      // 获取窗口宽度
      const windowWidth = window.innerWidth

      // 计算容器宽度（窗口宽度的90%）
      const availableWidth = windowWidth * 0.9

      // 移动端特殊处理 - 在小屏幕上使用单列布局
      if (windowWidth < 640) {
        setColumns(1)
        setContainerWidth("100%") // 移动端使用100%宽度
        setPageContainerWidth("95%") // 移动端页面容器稍微宽一点
        return
      }

      // 计算可以容纳的内容块数量（考虑间距）
      // 每个内容块占用的总宽度 = 内容块宽度 + 间距
      // 最后一个内容块不需要考虑右侧间距，但为了简化计算，我们统一考虑
      const totalBlockWidth = CONTENT_BLOCK_WIDTH + GAP_WIDTH

      // 计算可以容纳的内容块数量并向下取整
      const maxColumns = Math.floor(availableWidth / totalBlockWidth)

      // 确保至少有1列
      const safeColumns = Math.max(1, maxColumns)

      // 计算实际容器宽度，使其刚好容纳整数个内容块
      // 最后一个内容块右侧不需要间距，所以要减去一个间距宽度
      const actualContainerWidth = safeColumns * CONTENT_BLOCK_WIDTH + (safeColumns - 1) * GAP_WIDTH

      // 设置是否为宽屏
      setIsWideScreen(safeColumns > DEFAULT_COLUMNS)

      // 更新状态
      setColumns(safeColumns)
      setContainerWidth(`${actualContainerWidth}px`)
      setPageContainerWidth("90%")
    }

    // 初始计算
    calculateColumns()

    // 监听窗口大小变化
    window.addEventListener("resize", calculateColumns)

    // 清理函数
    return () => {
      window.removeEventListener("resize", calculateColumns)
    }
  }, [])

  return { columns, containerWidth, pageContainerWidth, isWideScreen }
}
