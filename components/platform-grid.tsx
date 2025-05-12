"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, RefreshCw, X, Search, ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { platformConfig, categories } from "@/config/platforms"
import type { PlatformData, Topic } from "@/types"
import { AnimatePresence, motion } from "framer-motion"
import { SearchDialog } from "@/components/search-dialog"
import { KeywordAnalysisDialog } from "./keyword-analysis-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import dynamic from "next/dynamic"
import { formatTimestamp } from "@/lib/utils"
import { SkeletonCard } from "./skeleton-card"
import { LoadingState } from "./loading-state"

// 导入性能相关工具和钩子
import { usePerformance } from "@/components/performance-provider"
import { debounce, throttle } from "@/lib/performance-utils"

// 导入新的浏览器工具函数
import { isSafari, applySafariOptimizations } from "@/lib/browser-utils"

// 动态导入平台卡片组件，减少初始加载时间
const PlatformCard = dynamic(() => import("./platform-card"), {
  loading: () => <SkeletonCard />,
  ssr: false,
})

// 定义平台的固定顺序
const FEATURED_PLATFORMS_ROW1 = ["bilibili", "weibo", "douyin", "zhihu", "36kr"]
const FEATURED_PLATFORMS_ROW2 = ["github", "juejin", "sspai", "tieba", "v2ex"]

// 每页显示的条目数
const ITEMS_PER_PAGE = 10

// 定义可能需要特殊处理的平台
const PROBLEMATIC_PLATFORMS = ["hupu"]

// 批量加载平台的数量
let BATCH_SIZE = 3
let BATCH_DELAY = 500

// 热度颜色映射函数 - 根据热度值返回对应的颜色类名
const getHeatColorClass = (percentage: number): string => {
  if (percentage >= 0.8) return "bg-gradient-to-r from-red-500 to-orange-500" // 非常热门
  if (percentage >= 0.5) return "bg-gradient-to-r from-orange-500 to-yellow-500" // 热门
  if (percentage >= 0.3) return "bg-gradient-to-r from-yellow-500 to-green-500" // 较热门
  return "bg-gradient-to-r from-blue-500 to-cyan-500" // 一般热门
}

// 在组件内部使用性能配置
export default function PlatformGrid() {
  // 获取性能配置
  const performanceConfig = usePerformance()

  // 使用性能配置设置批量加载参数
  BATCH_SIZE = performanceConfig.batchSize
  BATCH_DELAY = performanceConfig.batchDelay

  const [platformsData, setPlatformsData] = useState<Record<string, PlatformData | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])
  const [platformErrors, setPlatformErrors] = useState<Record<string, string>>({})
  const [isDiscoveringPlatforms, setIsDiscoveringPlatforms] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false) // 新增：跟踪初始化状态
  const [showSkeletons, setShowSkeletons] = useState(true) // 新增：控制骨架屏显示

  // 悬浮卡片状态
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const expandedCardRef = useRef<HTMLDivElement>(null)

  // 悬浮预览状态
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)

  // 用于跟踪可见平台的ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const platformRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 用于跟踪组件是否已挂载
  const isMountedRef = useRef(true)

  // 用于跟踪活动的请求控制器
  const activeControllersRef = useRef(new Set<AbortController>())

  // 用于跟踪最后一次获取数据的时间
  const lastFetchTimeRef = useRef<number>(0)

  // 点击外部关闭悬浮卡片
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (expandedCardRef.current && !expandedCardRef.current.contains(event.target as Node)) {
        setExpandedPlatform(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [expandedCardRef])

  // 重置分页当平台变化时
  useEffect(() => {
    setCurrentPage(1)
  }, [expandedPlatform])

  // 设置组件挂载状态
  useEffect(() => {
    isMountedRef.current = true

    // 应用Safari特定优化
    applySafariOptimizations()

    return () => {
      isMountedRef.current = false

      // 中止所有活动的请求
      activeControllersRef.current.forEach((controller) => {
        try {
          if (!controller.signal.aborted) {
            controller.abort()
          }
        } catch (e) {
          console.error("Error aborting request:", e)
        }
      })
      activeControllersRef.current.clear()

      // 清除悬浮预览的定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // 添加这个 useEffect 在 expandedPlatform 变化时控制页面滚动
  useEffect(() => {
    // 当悬浮卡片打开时，禁用页面滚动
    if (expandedPlatform) {
      // 保存当前滚动位置
      const scrollY = window.scrollY

      // 添加样式禁用滚动并固定页面位置
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
    } else {
      // 恢复滚动
      const scrollY = document.body.style.top
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""

      // 恢复滚动位置
      if (scrollY) {
        window.scrollTo(0, Number.parseInt(scrollY || "0", 10) * -1)
      }
    }

    return () => {
      // 组件卸载时确保恢复滚动
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
    }
  }, [expandedPlatform])

  // 创建和跟踪 AbortController
  const createController = useCallback(() => {
    const controller = new AbortController()
    activeControllersRef.current.add(controller)

    return controller
  }, [])

  // 移除 AbortController
  const removeController = useCallback((controller: AbortController) => {
    activeControllersRef.current.delete(controller)
  }, [])

  // Function to discover which platforms are actually available from the API
  const discoverAvailablePlatforms = useCallback(async () => {
    if (!isMountedRef.current) return []

    setIsDiscoveringPlatforms(true)
    console.log("Discovering available platforms...")

    try {
      // First try the /all endpoint to get a list of all platforms
      const controller = createController()
      const allResponse = await fetch("https://dailyhotpage-lac.vercel.app/all", {
        signal: controller.signal,
      }).finally(() => {
        removeController(controller)
      })

      if (allResponse.ok) {
        const allData = await allResponse.json()
        console.log("API /all response:", allData)

        if (allData && allData.routes && Array.isArray(allData.routes)) {
          // Extract available platforms (those with a path)
          const platforms = allData.routes
            .filter((item: any) => item.path !== null)
            .map((item: any) => item.name)
            .filter(Boolean)

          console.log("Available platforms from /all:", platforms)

          // 从可用平台列表中移除已知有问题的平台
          const filteredPlatforms = platforms.filter((platform) => !PROBLEMATIC_PLATFORMS.includes(platform))

          if (isMountedRef.current) {
            // 只有当平台列表发生变化时才更新状态
            setAvailablePlatforms((prev) => {
              // 如果平台列表没有变化，返回之前的状态
              if (prev.length === filteredPlatforms.length && prev.every((p, i) => p === filteredPlatforms[i])) {
                return prev
              }

              // 为已知有问题的平台设置错误信息
              PROBLEMATIC_PLATFORMS.forEach((platform) => {
                if (platforms.includes(platform)) {
                  setPlatformErrors((prev) => ({
                    ...prev,
                    [platform]: "此平台暂时不可用",
                  }))
                }
              })

              return filteredPlatforms
            })
          }

          return filteredPlatforms
        }
      }

      console.log("/all endpoint failed or returned unexpected format, trying direct platform discovery")

      // If /all fails or returns unexpected format, try to discover platforms by testing each one
      const discovered = []
      // Get all platform keys from our config
      const testPlatforms = Object.keys(platformConfig).filter((platform) => !PROBLEMATIC_PLATFORMS.includes(platform)) // 排除已知有问题的平台

      // Test each platform with a HEAD request to see if it exists
      for (const platform of testPlatforms) {
        if (!isMountedRef.current) break

        try {
          const controller = createController()
          const signal = controller.signal

          // Use Promise.race with a timeout
          const timeoutPromise = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              controller.abort()
              reject(new Error(`Discovery request for ${platform} timed out`))
            }, 3000)

            // Clear timeout if component unmounts
            return () => clearTimeout(timeoutId)
          })

          const fetchPromise = fetch(`https://dailyhotpage-lac.vercel.app/${platform}`, {
            method: "HEAD",
            signal,
          }).finally(() => {
            removeController(controller)
          })

          // Use Promise.race between timeout and successful request
          const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

          if (response.ok) {
            discovered.push(platform)
          }
        } catch (error) {
          // Ignore discovery errors for abort errors
          const isAbortError =
            error instanceof Error && (error.name === "AbortError" || error.message.includes("aborted"))

          if (!isAbortError) {
            console.log(`Platform discovery for ${platform} failed: ${error}`)
          }
        }
      }

      console.log("Discovered platforms:", discovered)

      if (isMountedRef.current) {
        setAvailablePlatforms(discovered)
      }

      return discovered
    } catch (error) {
      console.error("Error during platform discovery:", error)
      return []
    } finally {
      if (isMountedRef.current) {
        setIsDiscoveringPlatforms(false)
      }
    }
  }, [createController, removeController])

  // Get possible API endpoint names for a platform
  const getPossibleEndpointNames = useCallback((platform: string): string[] => {
    const possibleNames = []

    // Add the original platform name
    possibleNames.push(platform)

    // Add special cases
    if (platform === "github") {
      possibleNames.push("hellogithub")
    } else if (platform === "36kr") {
      possibleNames.push("kr36")
    }

    // Add hyphenated version
    if (platform.includes(" ")) {
      possibleNames.push(platform.replace(/ /g, "-"))
    }

    return possibleNames
  }, [])

  // Get the most likely API endpoint name for a platform
  const getApiEndpointName = useCallback((platform: string): string => {
    if (platform === "github") return "hellogithub"
    if (platform === "36kr") return "kr36"
    return platform
  }, [])

  // 修改 fetchPlatformData 函数，添加 forceRefresh 参数
  const fetchPlatformData = useCallback(
    async (platform: string, retryCount = 0, forceRefresh = false) => {
      // 在函数开始处添加检查，避免不必要的状态更新
      if (!isMountedRef.current) return

      // 如果平台已经在加载中，避免重复设置加载状态
      if (loading[platform]) return

      if (!isMountedRef.current) return

      // 最大重试次数
      const MAX_RETRIES = 2

      // 跳过已知有问题的平台
      if (PROBLEMATIC_PLATFORMS.includes(platform)) {
        setPlatformErrors((prev) => ({
          ...prev,
          [platform]: "此平台暂时不可用",
        }))
        return
      }

      // Skip platforms we know aren't available
      if (
        availablePlatforms.length > 0 &&
        !availablePlatforms.includes(platform) &&
        !availablePlatforms.includes(getApiEndpointName(platform))
      ) {
        console.log(`Skipping ${platform} as it's not in the available platforms list`)
        setPlatformErrors((prev) => ({
          ...prev,
          [platform]: "此平台暂不支持",
        }))
        return
      }

      setLoading((prev) => ({ ...prev, [platform]: true }))

      // Try different possible endpoint names
      const endpointNames = getPossibleEndpointNames(platform)
      let succeeded = false

      for (const endpointName of endpointNames) {
        if (!isMountedRef.current || succeeded) break

        try {
          console.log(`Trying to fetch ${platform} data using endpoint: ${endpointName}`)

          // 创建一个新的 AbortController 实例
          const controller = createController()
          const signal = controller.signal

          // 构建URL，如果forceRefresh为true，则添加cache=false参数
          const url = new URL(`https://dailyhotpage-lac.vercel.app/${endpointName}`)
          if (forceRefresh) {
            url.searchParams.append("cache", "false")
          }

          // 使用 Promise.race 和显式的超时 Promise，而不是依赖 AbortSignal.timeout
          // 这样我们可以更好地控制超时行为和错误消息
          const timeoutPromise = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              controller.abort()
              reject(new Error(`Request for ${endpointName} timed out after 8 seconds`))
            }, 8000)

            return () => clearTimeout(timeoutId)
          })

          const fetchPromise = fetch(url.toString(), {
            signal,
          }).finally(() => {
            removeController(controller)
          })

          // 使用 Promise.race 在超时和成功请求之间竞争
          const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

          if (!response.ok) {
            const errorMessage = `API returned ${response.status}: ${response.statusText}`
            console.warn(errorMessage)

            // 如果这是最后一个尝试的端点，存储错误
            if (endpointName === endpointNames[endpointNames.length - 1] && isMountedRef.current) {
              setPlatformErrors((prev) => ({
                ...prev,
                [platform]: response.status === 404 ? "此平台暂不支持" : errorMessage,
              }))
            }

            // 继续尝试下一个端点名称
            continue
          }

          const data = await response.json()

          // 检查响应是否具有预期的结构
          if (data && typeof data === "object" && Array.isArray(data.data)) {
            if (isMountedRef.current) {
              // 立即更新数据，不等待其他平台
              setPlatformsData((prev) => {
                const newData = { ...prev, [platform]: data }

                // 如果已经有一些数据了，可以考虑隐藏骨架屏
                if (Object.keys(newData).length >= BATCH_SIZE) {
                  // 使用setTimeout确保状态更新不会阻塞UI渲染
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setShowSkeletons(false)
                    }
                  }, 0)
                }

                return newData
              })

              // 清除之前的错误
              setPlatformErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[platform]
                return newErrors
              })

              // 如果此平台不在我们的可用列表中但可用，则添加它
              if (!availablePlatforms.includes(endpointName)) {
                setAvailablePlatforms((prev) => [...prev, endpointName])
              }

              // 立即标记为加载完成
              setLoading((prev) => ({ ...prev, [platform]: false }))
            }

            succeeded = true
            break
          } else {
            console.error(`Invalid data structure for ${platform} using ${endpointName}:`, data)

            // 如果这是最后一个尝试的端点，存储错误
            if (endpointName === endpointNames[endpointNames.length - 1] && isMountedRef.current) {
              setPlatformErrors((prev) => ({
                ...prev,
                [platform]: "数据格式错误",
              }))
            }
          }
        } catch (error) {
          // Don't update state if the request was intentionally aborted
          const isAbortError =
            error instanceof Error && (error.name === "AbortError" || error.message.includes("aborted"))

          if (!isAbortError) {
            // Only log non-abort errors
            const errorMessage = error instanceof Error ? error.message : "未知错误"
            const isNetworkError = errorMessage.includes("Failed to fetch")

            console.error(
              `Error fetching ${platform} data using ${endpointName}: ${errorMessage}`,
              isNetworkError ? "(网络错误)" : "",
              error,
            )

            // If this is the last endpoint attempt, store the error
            if (endpointName === endpointNames[endpointNames.length - 1] && isMountedRef.current) {
              setPlatformErrors((prev) => ({
                ...prev,
                [platform]: isNetworkError
                  ? "网络错误，请检查连接"
                  : error instanceof Error
                    ? error.message
                    : "未知错误",
              }))
            }
          }
        }
      }

      // If all attempts failed, set the platform data to null
      if (!succeeded && isMountedRef.current) {
        setPlatformsData((prev) => ({
          ...prev,
          [platform]: null,
        }))
      }

      // 如果所有尝试都失败，并且我们还没有达到最大重试次数，则重试
      if (!succeeded && retryCount < MAX_RETRIES && isMountedRef.current) {
        console.log(`Retrying ${platform} (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
        // 使用指数退避策略，每次重试等待时间增加
        const retryDelay = 1000 * Math.pow(2, retryCount)
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            fetchPlatformData(platform, retryCount + 1, forceRefresh)
          }
        }, retryDelay)

        return () => clearTimeout(timeoutId)
      } else if (isMountedRef.current) {
        setLoading((prev) => ({ ...prev, [platform]: false }))
      }
    },
    [availablePlatforms, getPossibleEndpointNames, getApiEndpointName, createController, removeController, loading],
  )

  // 批量加载平台数据
  const fetchPlatformsInBatches = useCallback(
    async (platforms: string[], forceRefresh = false) => {
      if (!isMountedRef.current) return

      // 防止重复加载 - 添加一个简单的防抖机制
      const now = Date.now()
      if (now - lastFetchTimeRef.current < 2000 && !forceRefresh) {
        console.log("Skipping fetch, too soon since last fetch")
        return
      }
      lastFetchTimeRef.current = now

      try {
        // 如果是初始加载，先显示骨架屏
        if (isInitialLoad) {
          setShowSkeletons(true)
        }

        // 为Safari减少批量大小和增加延迟
        const safariAdjustedBatchSize = isSafari() ? Math.max(1, Math.floor(BATCH_SIZE / 2)) : BATCH_SIZE
        const safariAdjustedBatchDelay = isSafari() ? BATCH_DELAY * 1.5 : BATCH_DELAY

        // 将平台分成批次
        for (let i = 0; i < platforms.length; i += safariAdjustedBatchSize) {
          // Check if still mounted before processing each batch
          if (!isMountedRef.current) break

          const batch = platforms.slice(i, i + safariAdjustedBatchSize)

          // 并行加载每个批次中的平台，但不等待所有完成再显示
          // 使用Promise.allSettled而不是Promise.all，这样一个请求失败不会影响其他请求
          const batchPromises = batch.map((platform) => {
            // Only fetch if still mounted
            if (isMountedRef.current) {
              return fetchPlatformData(platform, 0, forceRefresh)
                .then(() => {
                  // 每个平台数据加载完成后，立即隐藏该平台的骨架屏
                  if (isMountedRef.current && platformsData[platform]) {
                    // 如果已经有数据了，可以考虑隐藏骨架屏
                    if (Object.keys(platformsData).length > batch.length) {
                      setShowSkeletons(false)
                    }
                  }
                  return { platform, success: true }
                })
                .catch((error) => {
                  console.error(`Error loading platform ${platform}:`, error)
                  return { platform, success: false, error }
                })
            }
            return Promise.resolve({ platform, success: false, skipped: true })
          })

          // 等待当前批次的请求完成或失败
          await Promise.allSettled(batchPromises)

          // 如果至少有一些数据已加载，就隐藏骨架屏
          if (isMountedRef.current && Object.keys(platformsData).length > 0) {
            setShowSkeletons(false)
          }

          // 在批次之间添加延迟，避免一次性发送太多请求
          if (i + safariAdjustedBatchSize < platforms.length && isMountedRef.current) {
            await new Promise((resolve) => {
              const timeoutId = setTimeout(resolve, safariAdjustedBatchDelay)
              // Clear timeout if unmounted
              if (!isMountedRef.current) clearTimeout(timeoutId)
            })
          }
        }
      } finally {
        // Only update state if still mounted
        if (isMountedRef.current) {
          setIsInitialLoad(false)

          // 确保所有数据加载完成后，骨架屏一定被隐藏
          setShowSkeletons(false)
        }
      }
    },
    [fetchPlatformData, platformsData, isInitialLoad],
  )

  // 修改 fetchAllPlatforms 函数，添加 forceRefresh 参数
  const fetchAllPlatforms = useCallback(
    async (forceRefresh = false) => {
      if (!isMountedRef.current) return

      // 显示骨架屏
      setShowSkeletons(true)

      // First discover which platforms are available
      if (availablePlatforms.length === 0) {
        await discoverAvailablePlatforms()
      }

      // 获取要加载的平台列表
      const platformsToLoad = Object.keys(platformConfig).filter(
        (platform) => !PROBLEMATIC_PLATFORMS.includes(platform),
      ) // 排除已知有问题的平台

      // 批量加载平台数据
      await fetchPlatformsInBatches(platformsToLoad, forceRefresh)

      if (isMountedRef.current) {
        setLastUpdated(new Date())
      }
    },
    [availablePlatforms, discoverAvailablePlatforms, fetchPlatformsInBatches],
  )

  // 设置交叉观察器来监视平台卡片的可见性
  useEffect(() => {
    // 如果浏览器支持 IntersectionObserver
    if ("IntersectionObserver" in window) {
      // 为Safari使用不同的配置
      const observerConfig = isSafari()
        ? { rootMargin: "300px", threshold: 0.01 }
        : { rootMargin: "200px", threshold: 0.1 }

      // 跟踪最后一次观察触发的时间，防止频繁触发
      let lastObserverTriggerTime = 0
      const OBSERVER_DEBOUNCE_TIME = isSafari() ? 1000 : 300 // Safari上使用更长的防抖时间

      // 创建观察器
      observerRef.current = new IntersectionObserver((entries) => {
        // 防抖处理，避免短时间内多次触发
        const now = Date.now()
        if (now - lastObserverTriggerTime < OBSERVER_DEBOUNCE_TIME) {
          return
        }
        lastObserverTriggerTime = now

        const visiblePlatforms = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-platform"))
          .filter(Boolean) as string[]

        if (visiblePlatforms.length > 0) {
          // 找出需要加载的平台（没有数据且没有在加载中）
          const platformsToLoad = visiblePlatforms.filter(
            (platform) => !platformsData[platform] && !loading[platform] && !platformErrors[platform],
          )

          if (platformsToLoad.length > 0) {
            console.log(`Loading visible platforms: ${platformsToLoad.join(", ")}`)
            // 在Safari上减少并发请求数
            const maxConcurrent = isSafari() ? 1 : 2
            fetchPlatformsInBatches(platformsToLoad.slice(0, maxConcurrent))
          }
        }
      }, observerConfig)

      // 为所有平台卡片添加观察
      Object.entries(platformRefs.current).forEach(([platform, el]) => {
        if (el) {
          el.setAttribute("data-platform", platform)
          observerRef.current?.observe(el)
        }
      })
    }

    return () => {
      // 清理观察器
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchPlatformsInBatches, platformsData, loading, platformErrors])

  // 获取按指定顺序排列的平台 - 使用useMemo优化
  const getOrderedPlatforms = useMemo(() => {
    const filteredPlatforms = Object.entries(platformConfig)
      .filter(([_, config]) => {
        if (activeCategory === null) {
          return true // 如果没有选择分类，则包括所有平台
        } else {
          return config.category === activeCategory // 否则，只包括所选分类的平台
        }
      })
      .map(([key, config]) => ({ key, config }))

    // 如果没有选择分类，则按指定顺序排列
    if (activeCategory === null) {
      const result: { key: string; config: any }[] = []

      // 添加第一行特定平台
      FEATURED_PLATFORMS_ROW1.forEach((platform) => {
        if (platformConfig[platform]) {
          result.push({ key: platform, config: platformConfig[platform] })
        }
      })

      // 添加第二行特定平台
      FEATURED_PLATFORMS_ROW2.forEach((platform) => {
        if (platformConfig[platform]) {
          result.push({ key: platform, config: platformConfig[platform] })
        }
      })

      // 添加其他平台，按分类分组
      const remainingPlatforms = Object.entries(platformConfig)
        .filter(([key, _]) => !FEATURED_PLATFORMS_ROW1.includes(key) && !FEATURED_PLATFORMS_ROW2.includes(key))
        .sort((a, b) => {
          // 首先按分类排序
          const categoryA = a[1].category
          const categoryB = b[1].category
          if (categoryA !== categoryB) {
            return categoryA.localeCompare(categoryB)
          }
          // 然后按名称排序
          return a[1].title.localeCompare(b[1].title)
        })
        .map(([key, config]) => ({ key, config }))

      return [...result, ...remainingPlatforms]
    }

    return filteredPlatforms
  }, [activeCategory])

  // 在平台列表变化时重新设置观察器
  useEffect(() => {
    if (observerRef.current) {
      // 先断开所有观察
      observerRef.current.disconnect()

      // 重新观察所有平台元素
      Object.entries(platformRefs.current).forEach(([platform, el]) => {
        if (el) {
          el.setAttribute("data-platform", platform)
          observerRef.current?.observe(el)
        }
      })

      console.log("Re-observed all platforms after list change")
    }
  }, [getOrderedPlatforms])

  // 初始加载 - 修复无限刷新问题
  useEffect(() => {
    // 防止重复初始化
    if (isInitialized) return

    // 标记为已初始化，确保此 effect 只运行一次
    setIsInitialized(true)

    // 显示骨架屏
    setShowSkeletons(true)

    // 首先发现可用平台
    const discoverAndLoad = async () => {
      if (!isMountedRef.current) return

      try {
        // 显示骨架屏，但设置较短的超时以确保UI不会长时间空白
        setShowSkeletons(true)

        // 添加Safari特定的检查，避免重复加载
        const isSafariBrowser = isSafari()

        // 在Safari上添加短暂延迟，避免立即加载导致的重复刷新
        if (isSafariBrowser) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        await discoverAvailablePlatforms()

        // 然后批量加载初始平台，但不等待全部完成再显示
        if (isMountedRef.current) {
          // 优先加载首屏可见平台
          const initialPlatforms = [...FEATURED_PLATFORMS_ROW1, ...FEATURED_PLATFORMS_ROW2]

          // 不等待所有平台加载完成，而是立即开始加载
          fetchPlatformsInBatches(initialPlatforms).catch((error) => {
            console.error("Error loading initial platforms:", error)
            // 确保即使出错也不会一直显示骨架屏
            setShowSkeletons(false)
          })

          // 设置一个较短的超时，确保即使API响应慢也会在一定时间后隐藏骨架屏
          setTimeout(() => {
            if (isMountedRef.current && Object.keys(platformsData).length === 0) {
              // 如果还没有数据，显示一个友好的消息而不是骨架屏
              setIsDiscoveringPlatforms(false)
              setShowSkeletons(false)
            }
          }, 5000) // 5秒后如果还没有数据，就隐藏骨架屏
        }
      } catch (error) {
        console.error("Error during initial load:", error)
        // 确保即使出错也不会一直显示骨架屏
        setShowSkeletons(false)
        setIsDiscoveringPlatforms(false)
      }
    }

    discoverAndLoad()

    // 设置轮询，每5分钟自动刷新数据
    // 在Safari上增加随机延迟，避免精确的5分钟导致的同步问题
    const randomDelay = isSafari() ? Math.floor(Math.random() * 10000) : 0
    const intervalId = setInterval(
      () => {
        if (isMountedRef.current) {
          // 只刷新已加载的平台
          const loadedPlatforms = Object.keys(platformsData)
          if (loadedPlatforms.length > 0) {
            console.log("Auto-refreshing platforms:", loadedPlatforms.length)
            fetchPlatformsInBatches(loadedPlatforms, true)
          }
        }
      },
      5 * 60 * 1000 + randomDelay,
    )

    // 清理函数
    return () => {
      clearInterval(intervalId)
    }
  }, [isInitialized, discoverAvailablePlatforms, fetchPlatformsInBatches, platformsData])

  const formatNumber = useCallback((num: number) => {
    // 确保num是数字
    const numValue = typeof num === "string" ? Number(num) : num

    if (numValue >= 10000) {
      return `${(numValue / 10000).toFixed(1)}万`
    }
    return numValue.toString()
  }, [])

  // Count platforms in each category - 使用useMemo优化
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: Object.keys(platformConfig).length }

    Object.values(platformConfig).forEach((config) => {
      const category = config.category as string
      counts[category] = (counts[category] || 0) + 1
    })

    return counts
  }, [])

  // 处理翻页
  const handlePageChange = useCallback(
    (direction: "prev" | "next") => {
      if (!expandedPlatform) return

      const data = platformsData[expandedPlatform]
      if (!data || !data.data || !Array.isArray(data.data)) return

      const totalItems = data.data.length
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      if (direction === "prev" && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else if (direction === "next" && currentPage < totalPages) {
        setCurrentPage(currentPage + 1)
      }
    },
    [expandedPlatform, platformsData, currentPage],
  )

  // 获取当前页的数据
  const getPaginatedData = useCallback(
    (data: Topic[]) => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      return data.slice(startIndex, endIndex)
    },
    [currentPage],
  )

  // 修改处理悬浮预览的函数，优化悬浮预览框的位置计算

  // 处理悬浮预览
  const handleTopicHover = useCallback((topic: Topic, event: React.MouseEvent) => {
    // 清除之前的定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // 设置短暂延迟，避免鼠标快速划过时显示预览
    hoverTimeoutRef.current = setTimeout(() => {
      // 如果标题为空，不显示预览
      if (!topic.title) return

      // 确保 event.currentTarget 存在
      if (!event.currentTarget) {
        console.warn("Topic hover event has no currentTarget")
        return
      }

      // 计算悬浮框位置，确保在视口内
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()

      // 获取视口高度和宽度
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // 预估悬浮框的尺寸 - 根据内容调整高度
      const hasExtraContent = topic.desc || topic.author || topic.timestamp
      const previewHeight = hasExtraContent ? 150 : 80
      const previewWidth = 300

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

      setHoverPosition({
        x: xPosition + window.scrollX,
        y: yPosition + window.scrollY,
      })

      // 无论如何都设置悬停主题，即使没有额外内容
      setHoveredTopic(topic)
    }, 200) // 减少延迟时间，使响应更快
  }, [])

  const handleTopicLeave = useCallback(() => {
    // 清除定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    // 设置短暂延迟，避免鼠标在预览和条目之间移动时闪烁
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTopic(null)
    }, 50) // 减少延迟时间，使响应更快
  }, [])

  // 渲染悬浮卡片
  const renderExpandedCard = useCallback(() => {
    if (!expandedPlatform) return null

    const config = platformConfig[expandedPlatform]
    if (!config) return null

    const hasData =
      platformsData[expandedPlatform] &&
      platformsData[expandedPlatform]?.data &&
      platformsData[expandedPlatform]?.data.length > 0

    // 计算分页信息
    const totalItems = hasData ? platformsData[expandedPlatform]?.data.length || 0 : 0
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    // 获取当前页的数据
    const paginatedData = hasData ? getPaginatedData(platformsData[expandedPlatform]?.data || []) : []

    // 计算当前页面中的最大热度值，用于归一化热度条
    const maxHotValue = paginatedData.reduce((max, topic) => {
      return topic.hot && Number(topic.hot) > max ? Number(topic.hot) : max
    }, 0)

    // 检查平台是否不支持
    const errorMessage = platformErrors[expandedPlatform]
    const isUnsupported = errorMessage === "此平台暂不支持" || errorMessage === "此平台暂时不可用"

    // 生成页码数组
    const getPageNumbers = () => {
      const pageNumbers = []
      const maxPageButtons = 5 // 最多显示的页码按钮数

      if (totalPages <= maxPageButtons) {
        // 如果总页数小于等于最大按钮数，显示所有页码
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // 否则，显示当前页附近的页码
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
        let endPage = startPage + maxPageButtons - 1

        if (endPage > totalPages) {
          endPage = totalPages
          startPage = Math.max(1, endPage - maxPageButtons + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i)
        }

        // 添加省略号
        if (startPage > 1) {
          pageNumbers.unshift("...")
          pageNumbers.unshift(1)
        }

        if (endPage < totalPages) {
          pageNumbers.push("...")
          pageNumbers.push(totalPages)
        }
      }

      return pageNumbers
    }

    // 使用更轻量的动画配置
    const modalAnimation = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    }

    return (
      <motion.div
        {...modalAnimation}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm will-change-transform"
        onClick={() => setExpandedPlatform(null)}
      >
        <div
          ref={expandedCardRef}
          className="w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] bg-card rounded-lg shadow-lg overflow-hidden will-change-transform mx-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {config.icon && <config.icon className="h-5 w-5" />}
              <h3 className="text-lg font-semibold">{config.title}</h3>
              {platformsData[expandedPlatform] && platformsData[expandedPlatform]?.type && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {platformsData[expandedPlatform]?.type || "热榜"}
                </Badge>
              )}
            </div>

            {/* 将底部按钮移到顶部右侧，并添加更新时间 */}
            <div className="flex items-center gap-2">
              {platformsData[expandedPlatform]?.updateTime && (
                <span className="text-xs text-muted-foreground mr-2">
                  更新于: {new Date(platformsData[expandedPlatform]?.updateTime || "").toLocaleTimeString()}
                </span>
              )}
              {!isUnsupported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    fetchPlatformData(expandedPlatform, 0, true)
                  }}
                  disabled={loading[expandedPlatform]}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading[expandedPlatform] ? "animate-spin" : ""}`} />
                  刷新
                </Button>
              )}
              {platformsData[expandedPlatform]?.link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(platformsData[expandedPlatform]?.link, "_blank")
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  查看源站
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full ml-2"
                onClick={() => setExpandedPlatform(null)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
            <p className="text-sm text-muted-foreground mb-4">
              {platformsData[expandedPlatform]?.description || config.description}
            </p>

            {hasData ? (
              <ul className="py-1.5 space-y-1">
                {paginatedData.map((topic: Topic, index: number) => {
                  // 计算实际索引，用于确定排名样式
                  const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index

                  // 计算热度百分比，用于热度条宽度和颜色
                  const hotPercentage = topic.hot && maxHotValue ? Number(topic.hot) / maxHotValue : 0
                  const heatColorClass = getHeatColorClass(hotPercentage)

                  return (
                    <li
                      key={index}
                      className="group relative overflow-hidden rounded-md transition-all duration-200"
                      onMouseEnter={(e) => handleTopicHover(topic, e)}
                      onMouseLeave={handleTopicLeave}
                      style={{ touchAction: "manipulation" }} // 优化移动端响应
                    >
                      <a
                        href={topic.url || topic.mobileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 rounded-md p-1 transition-colors hover:bg-muted/70"
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-medium transition-all duration-200 ${
                            actualIndex < 3
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted-foreground/15 text-muted-foreground"
                          } group-hover:scale-110`}
                        >
                          {actualIndex + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-medium text-sm leading-tight line-clamp-2 transition-all duration-200">
                              {topic.title}
                            </span>
                            <div className="flex flex-col items-end gap-1 min-w-[60px]">
                              {topic.hot && Number(topic.hot) > 0 ? (
                                <>
                                  {/* 热度值数字显示 */}
                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatNumber(Number(topic.hot))}
                                    </span>
                                  </div>
                                  {/* 热度条可视化 */}
                                  <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${heatColorClass} rounded-full transition-all duration-300`}
                                      style={{ width: `${Math.max(5, hotPercentage * 100)}%` }}
                                    ></div>
                                  </div>
                                </>
                              ) : (
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground group-hover:text-primary" />
                              )}
                            </div>
                          </div>
                          {topic.desc && topic.desc !== topic.title && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 transition-all duration-200">
                              {topic.desc}
                            </p>
                          )}
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center p-6">
                {isUnsupported ? (
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="rounded-full bg-muted/50 p-4">
                      <AlertCircle className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">{errorMessage}</p>
                  </div>
                ) : errorMessage ? (
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="rounded-full bg-muted/50 p-4">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground/80">加载失败</p>
                      <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchPlatformData(expandedPlatform, 0, true)
                        }}
                        className="mt-2 rounded-full px-4 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        重新加载
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="rounded-full bg-muted/50 p-4">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium text-foreground/80">暂无数据</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 优化的分页控制器 */}
          {hasData && totalPages > 1 && (
            <div className="flex items-center justify-between py-4 px-4 bg-background">
              <div className="text-xs text-muted-foreground">共 {totalItems} 条</div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("prev")}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">上一页</span>
                </Button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="text-xs text-muted-foreground px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={`page-${page}`}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page as number)}
                      className={`h-8 w-8 p-0 ${currentPage === page ? "pointer-events-none" : ""}`}
                    >
                      <span className="text-xs">{page}</span>
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">下一页</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }, [
    expandedPlatform,
    platformsData,
    platformErrors,
    loading,
    currentPage,
    getPaginatedData,
    handlePageChange,
    fetchPlatformData,
    formatNumber,
    handleTopicHover,
    handleTopicLeave,
  ])

  // Category navigation items
  const categoryItems = useMemo(
    () => [
      { id: null, name: "全部", icon: null, count: categoryCounts.all },
      ...Object.entries(categories).map(([id, category]) => ({
        id,
        name: category.name,
        icon: category.icon,
        count: categoryCounts[id] || 0,
      })),
    ],
    [categoryCounts],
  )

  const orderedPlatforms = getOrderedPlatforms

  // 使用节流函数优化滚动处理
  const handleScroll = useCallback(
    throttle(() => {
      // 滚动处理逻辑
      console.log("Scroll event throttled")
    }, 100),
    [],
  )

  // 使用防抖函数优化搜索处理
  const handleSearch = useCallback(
    debounce((term: string) => {
      // 搜索处理逻辑
      console.log("Search debounced:", term)
      setSearchDialogOpen(true)
    }, 300),
    [],
  )

  // 添加滚动事件监听
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // 渲染骨架屏
  const renderSkeletons = () => {
    return (
      <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 stagger-animation animate-fade-in">
        {Array(10)
          .fill(0)
          .map((_, index) => (
            <SkeletonCard key={index} index={index} />
          ))}
      </div>
    )
  }

  if (isDiscoveringPlatforms && Object.keys(platformsData).length === 0) {
    return (
      <div className="space-y-6">
        {/* 顶部布局 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 animate-fade-in">
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-semibold tracking-tight">今日热榜</h2>
            <p className="mt-1 text-xs text-muted-foreground">实时聚合各大平台热门话题，每5分钟自动更新</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        <LoadingState message="正在发现可用平台..." />
        {renderSkeletons()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 新的顶部布局 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 animate-fade-in">
        <div className="flex flex-col items-start">
          <h2 className="text-xl font-semibold tracking-tight">今日热榜</h2>
          <p className="mt-1 text-xs text-muted-foreground">实时聚合各大平台热门话题，每5分钟自动更新</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-center text-xs text-muted-foreground mr-auto sm:mr-0">
            上次更新: {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: zhCN })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1 h-7 text-xs transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <Search className="h-3 w-3" />
            <span className="ml-1">搜索</span>
          </Button>
          <KeywordAnalysisDialog platformsData={platformsData} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllPlatforms(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1 h-7 text-xs transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="ml-1">刷新</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Category Navigation */}
      <div
        className="flex justify-start mb-5 animate-fade-in overflow-x-auto pb-1 scrollbar-thin"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="inline-flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto max-w-full">
          {categoryItems.map((item) => (
            <button
              key={item.id || "all"}
              onClick={() => setActiveCategory(item.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                activeCategory === item.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
              }`}
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.name} <span className="text-[10px] opacity-70">({item.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 显示骨架屏或实际内容 */}
      {showSkeletons ? (
        renderSkeletons()
      ) : (
        <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 stagger-animation animate-fade-in-up">
          {orderedPlatforms.map(({ key, config }, index) => (
            <div
              key={key}
              ref={(el) => (platformRefs.current[key] = el)}
              data-platform={key}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <PlatformCard
                platform={key}
                config={config}
                data={platformsData[key]}
                loading={loading[key] || false}
                error={platformErrors[key]}
                onRefresh={() => fetchPlatformData(key, 0, true)}
                onExpand={() => setExpandedPlatform(key)}
                isInitialLoad={isInitialLoad}
              />
            </div>
          ))}
        </div>
      )}

      {/* 悬浮卡片 */}
      <AnimatePresence>{expandedPlatform && renderExpandedCard()}</AnimatePresence>

      {/* 悬浮预览 */}
      <AnimatePresence>
        {hoveredTopic && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] bg-card border rounded-lg shadow-lg p-3 max-w-sm"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`,
              pointerEvents: "none", // 确保悬浮框不会阻止鼠标事件
              minWidth: "200px", // 确保有最小宽度
            }}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{hoveredTopic.title}</h4>
                {hoveredTopic.hot && Number(hoveredTopic.hot) > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatNumber(Number(hoveredTopic.hot))}
                    </span>
                  </div>
                )}
              </div>
              {hoveredTopic.desc && hoveredTopic.desc !== hoveredTopic.title && (
                <p className="text-xs text-muted-foreground">{hoveredTopic.desc}</p>
              )}
              {hoveredTopic.author && <div className="text-xs text-muted-foreground">作者: {hoveredTopic.author}</div>}
              {hoveredTopic.timestamp && (
                <div className="text-xs text-muted-foreground">发布时间: {formatTimestamp(hoveredTopic.timestamp)}</div>
              )}
              {!hoveredTopic.desc && !hoveredTopic.author && !hoveredTopic.timestamp && (
                <p className="text-xs text-muted-foreground italic">点击查看详情</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索对话框 */}
      <SearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} platformsData={platformsData} />
    </div>
  )
}
