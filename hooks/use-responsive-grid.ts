"use client"

import { useState, useEffect } from "react"

// 定义不同屏幕宽度的断点
const breakpoints = {
  xs: 480, // 超小屏幕
  sm: 640, // 小屏幕
  md: 768, // 中等屏幕
  lg: 1024, // 大屏幕
  xl: 1280, // 超大屏幕
  "2xl": 1536, // 2倍超大屏幕
  "3xl": 1920, // 3倍超大屏幕
  "4xl": 2560, // 4倍超大屏幕
}

// 定义每个断点对应的每行卡片数量
const defaultColumnsPerBreakpoint = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  "2xl": 6,
  "3xl": 7,
  "4xl": 8,
}

export type BreakpointKey = keyof typeof breakpoints

export function useResponsiveGrid(customColumnsPerBreakpoint?: Partial<Record<BreakpointKey, number>>) {
  // 合并默认配置和自定义配置
  const columnsPerBreakpoint = { ...defaultColumnsPerBreakpoint, ...customColumnsPerBreakpoint }

  // 状态：当前断点和列数
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>("lg")
  const [columns, setColumns] = useState(columnsPerBreakpoint.lg)

  // 检测窗口大小变化并更新断点和列数
  useEffect(() => {
    // 初始检测
    const updateSize = () => {
      const width = window.innerWidth

      // 从大到小检查断点
      if (width >= breakpoints["4xl"]) {
        setCurrentBreakpoint("4xl")
        setColumns(columnsPerBreakpoint["4xl"])
      } else if (width >= breakpoints["3xl"]) {
        setCurrentBreakpoint("3xl")
        setColumns(columnsPerBreakpoint["3xl"])
      } else if (width >= breakpoints["2xl"]) {
        setCurrentBreakpoint("2xl")
        setColumns(columnsPerBreakpoint["2xl"])
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint("xl")
        setColumns(columnsPerBreakpoint.xl)
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint("lg")
        setColumns(columnsPerBreakpoint.lg)
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint("md")
        setColumns(columnsPerBreakpoint.md)
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint("sm")
        setColumns(columnsPerBreakpoint.sm)
      } else {
        setCurrentBreakpoint("xs")
        setColumns(columnsPerBreakpoint.xs)
      }
    }

    // 初始化
    updateSize()

    // 添加窗口大小变化监听
    window.addEventListener("resize", updateSize)

    // 清理函数
    return () => window.removeEventListener("resize", updateSize)
  }, [columnsPerBreakpoint])

  return {
    currentBreakpoint,
    columns,
    isXs: currentBreakpoint === "xs",
    isSm: currentBreakpoint === "sm",
    isMd: currentBreakpoint === "md",
    isLg: currentBreakpoint === "lg",
    isXl: currentBreakpoint === "xl",
    is2Xl: currentBreakpoint === "2xl",
    is3Xl: currentBreakpoint === "3xl",
    is4Xl: currentBreakpoint === "4xl",
    isSmallScreen: ["xs", "sm"].includes(currentBreakpoint),
    isMediumScreen: ["md", "lg"].includes(currentBreakpoint),
    isLargeScreen: ["xl", "2xl", "3xl", "4xl"].includes(currentBreakpoint),
  }
}
