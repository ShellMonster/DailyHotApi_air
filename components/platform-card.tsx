"use client"

import type React from "react"

import { memo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, Flame } from "lucide-react"
import { motion } from "framer-motion"
import type { PlatformData, Topic } from "@/types"
import { isSafari } from "@/lib/browser-utils"
import { formatRelativeTime } from "@/lib/utils"

interface PlatformCardProps {
  platform: string
  config: any
  data: PlatformData | null | undefined
  loading: boolean
  error?: string
  onRefresh: (forceRefresh?: boolean) => void
  onExpand: () => void
  isInitialLoad: boolean
  onTopicHover?: (topic: Topic, element: HTMLElement) => void
  onTopicLeave?: () => void
}

// 使用memo优化组件，避免不必要的重渲染
const DEBUG_HOVER = false // 设置为true可以启用调试日志

const PlatformCard = memo(function PlatformCard({
  platform,
  config,
  data,
  loading,
  error,
  onRefresh,
  onExpand,
  isInitialLoad,
  onTopicHover,
  onTopicLeave,
}: PlatformCardProps) {
  const hasData = data && data.data && data.data.length > 0
  const isUnsupported = error === "此平台暂不支持" || error === "此平台暂时不可用"

  // 用于跟踪组件是否已挂载
  const isMounted = useRef(false)
  const topicRefs = useRef<Map<number, HTMLLIElement | null>>(new Map())

  const isSafariBrowser = isSafari() // 检测是否为Safari浏览器

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Cleanup function
    return () => {
      isMounted.current = false
    }
  }, [])

  const formatNumber = (num: number) => {
    // 确保num是数字
    const numValue = typeof num === "string" ? Number(num) : num

    if (numValue >= 10000) {
      return `${(numValue / 10000).toFixed(1)}万`
    }
    return numValue.toString()
  }

  // 处理鼠标悬停事件
  const handleMouseEnter = (topic: Topic, index: number, event: React.MouseEvent) => {
    if (DEBUG_HOVER) {
      console.log("Mouse enter:", topic.title, "index:", index)
    }

    // 如果提供了外部处理函数，则调用它
    if (onTopicHover && event.currentTarget) {
      onTopicHover(topic, event.currentTarget as HTMLElement)
    }
  }

  const handleMouseLeave = () => {
    if (DEBUG_HOVER) {
      console.log("Mouse leave")
    }

    // 如果提供了外部处理函数，则调用它
    if (onTopicLeave) {
      onTopicLeave()
    }
  }

  // 使用更轻量的动画配置
  const cardAnimation = isInitialLoad
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: isSafariBrowser ? 0.05 : 0.1 },
      }
    : {}

  // 优化卡片内容渲染，减少不必要的DOM元素
  const renderPlatformContent = () => {
    return (
      <div className="h-[242px] overflow-y-auto px-3 pb-0 scrollbar-thin">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : data === null || !hasData ? (
          <div className="flex h-full flex-col items-center justify-center">
            {isUnsupported ? (
              <div className="flex flex-col items-center space-y-2 p-4 text-center">
                <div className="rounded-full bg-muted/50 p-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-muted-foreground text-xs font-medium">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 p-4 text-center">
                {error ? (
                  <>
                    <div className="rounded-full bg-muted/50 p-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/80">加载失败</p>
                      <p className="text-xs text-muted-foreground mt-1">{error || "无法获取数据，请稍后再试"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-muted/50 p-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80">暂无数据</p>
                  </>
                )}
                {!isUnsupported && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isMounted.current) {
                          onRefresh()
                        }
                      }}
                      className="mt-2 h-8 rounded-full px-4 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      重新加载
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <ul className="py-1.5 space-y-1">
            {data.data.slice(0, 10).map((topic: Topic, index: number) => (
              <li
                key={index}
                ref={(el) => topicRefs.current.set(index, el)}
                className="group relative overflow-hidden rounded-md"
                onMouseEnter={(e) => handleMouseEnter(topic, index, e)}
                onMouseLeave={handleMouseLeave}
              >
                <a
                  href={topic.url || topic.mobileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 rounded-md p-1.5 hover:bg-muted/70 group-hover:shadow-sm transition-all duration-200 touch-manipulation"
                  title={topic.title} // 添加原生title属性作为备用
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                      index < 3 ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15 text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {topic.title}
                      </span>
                      {topic.hot && Number(topic.hot) > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Flame className="h-2.5 w-2.5 text-orange-500" />
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {formatNumber(Number(topic.hot))}
                          </span>
                        </div>
                      )}
                    </div>
                    {topic.desc && topic.desc !== topic.title && (
                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{topic.desc}</p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // 优化卡片点击响应
  return (
    <motion.div {...cardAnimation} layout={false} className="animate-fade-in-up">
      <Card className="overflow-hidden hover:shadow-sm dark:hover:shadow-primary/5">
        <CardHeader
          className="p-3.5 pb-2 space-y-0.5 cursor-pointer"
          onClick={onExpand}
          style={{ touchAction: "manipulation" }} // 优化移动端点击响应
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              {config.icon && <config.icon className="h-3.5 w-3.5" />}
              {config.title}
            </CardTitle>
            {data && data.type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {data.type || "热榜"}
              </Badge>
            )}
          </div>
          <CardDescription className="text-[10px] line-clamp-1">
            {data?.description || config.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 max-h-[240px]">{renderPlatformContent()}</CardContent>

        <CardFooter className="flex justify-between p-3.5 pt-2.5 border-t text-[10px]">
          <div className="flex items-center gap-1">
            <p className="text-muted-foreground">{data?.updateTime && formatRelativeTime(data.updateTime)}</p>
            {!isUnsupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation() // Prevent triggering card click event
                  if (isMounted.current) {
                    onRefresh(true) // 传递true表示强制刷新
                  }
                }}
                disabled={loading}
                className="h-3 w-3 rounded-full p-0"
                title="强制刷新"
              >
                <RefreshCw className={`h-2 w-2 ${loading ? "animate-spin" : ""}`} />
                <span className="sr-only">刷新</span>
              </Button>
            )}
          </div>
          {data?.link && (
            <a
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              查看源站
            </a>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
})

export default PlatformCard
