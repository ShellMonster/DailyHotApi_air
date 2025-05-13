"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, RefreshCw, X, Search, ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale" // Fix import path
import { platformConfig, categories } from "@/config/platforms"
import type { PlatformData, Topic } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { SearchDialog } from "@/components/search-dialog"
import { KeywordAnalysisDialog } from "./keyword-analysis-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import dynamic from "next/dynamic"
import { formatTimestamp, formatRelativeTime } from "@/lib/utils" // Import formatting functions
import { SkeletonCard } from "./skeleton-card"
import { LoadingState } from "./loading-state"

// Import performance-related tools and hooks
import { usePerformance } from "@/components/performance-provider"
import { debounce, throttle } from "@/lib/performance-utils"

// Import Safari detection and optimization functions
import { isSafari, applySafariOptimizations } from "@/lib/browser-utils"

// Import hover utilities
import { calculateHoverPosition, getHoverDelay } from "@/lib/hover-utils"

// Import responsive layout hook
import { useResponsiveLayout } from "@/hooks/use-responsive-layout"

// Dynamically import platform card component to reduce initial load time
const PlatformCard = dynamic(() => import("./platform-card"), {
  loading: () => <SkeletonCard />,
  ssr: false,
})

// Define fixed order for platforms
const FEATURED_PLATFORMS_ROW1 = ["bilibili", "weibo", "douyin", "zhihu", "36kr"]
const FEATURED_PLATFORMS_ROW2 = ["github", "juejin", "sspai", "tieba", "v2ex"]

// Items per page for pagination
const ITEMS_PER_PAGE = 10

// Define platforms that might need special handling
const PROBLEMATIC_PLATFORMS = ["hupu"]

// Batch loading parameters
let BATCH_SIZE = 3
let BATCH_DELAY = 500

// Heat color mapping function - returns color class based on heat value
const getHeatColorClass = (percentage: number): string => {
  if (percentage >= 0.8) return "bg-gradient-to-r from-red-500 to-orange-500" // Very hot
  if (percentage >= 0.5) return "bg-gradient-to-r from-orange-500 to-yellow-500" // Hot
  if (percentage >= 0.3) return "bg-gradient-to-r from-yellow-500 to-green-500" // Moderately hot
  return "bg-gradient-to-r from-blue-500 to-cyan-500" // Normal
}

// Main component
export default function PlatformGrid() {
  // Get performance config
  const performanceConfig = usePerformance()

  // Use responsive layout hook
  const layout = useResponsiveLayout()

  // Use performance config to set batch loading parameters
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
  const [isInitialized, setIsInitialized] = useState(false) // Track initialization state
  const [showSkeletons, setShowSkeletons] = useState(true) // Control skeleton screen display

  // Floating card state
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const expandedCardRef = useRef<HTMLDivElement>(null)

  // Hover preview state
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Refs for tracking visible platforms
  const observerRef = useRef<IntersectionObserver | null>(null)
  const platformRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Ref for tracking if component is mounted
  const isMountedRef = useRef(true)

  // Ref for tracking active request controllers
  const activeControllersRef = useRef(new Set<AbortController>())

  // Close floating card when clicking outside
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

  // Reset pagination when platform changes
  useEffect(() => {
    setCurrentPage(1)
  }, [expandedPlatform])

  // Set component mount state
  useEffect(() => {
    isMountedRef.current = true

    // Apply Safari-specific optimizations
    applySafariOptimizations()

    return () => {
      isMountedRef.current = false

      // Abort all active requests
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

      // Clear hover preview timer
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Control page scrolling when expanded platform changes
  useEffect(() => {
    // Disable page scrolling when floating card is open
    if (expandedPlatform) {
      // Disable scrolling without changing scroll position
      document.body.style.overflow = "hidden"
    } else {
      // Restore scrolling without changing scroll position
      document.body.style.overflow = ""
    }

    return () => {
      // Ensure scrolling is restored when component unmounts
      document.body.style.overflow = ""
    }
  }, [expandedPlatform])

  // Create and track AbortController
  const createController = useCallback(() => {
    const controller = new AbortController()
    activeControllersRef.current.add(controller)

    return controller
  }, [])

  // Remove AbortController
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

          // Remove known problematic platforms from available platforms list
          const filteredPlatforms = platforms.filter((platform) => !PROBLEMATIC_PLATFORMS.includes(platform))

          if (isMountedRef.current) {
            // Only update state if platform list has changed
            setAvailablePlatforms((prev) => {
              // If platform list hasn't changed, return previous state
              if (prev.length === filteredPlatforms.length && prev.every((p, i) => p === filteredPlatforms[i])) {
                return prev
              }

              // Set error messages for known problematic platforms
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
      const testPlatforms = Object.keys(platformConfig).filter((platform) => !PROBLEMATIC_PLATFORMS.includes(platform)) // Exclude known problematic platforms

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

  // Fetch platform data with forceRefresh parameter
  const fetchPlatformData = useCallback(
    async (platform: string, retryCount = 0, forceRefresh = false) => {
      // Add check at the beginning of the function to avoid unnecessary state updates
      if (!isMountedRef.current) return

      // If platform is already loading, avoid setting loading state again
      if (loading[platform]) return

      if (!isMountedRef.current) return

      // Maximum retry count
      const MAX_RETRIES = 2

      // Skip known problematic platforms
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

          // Create a new AbortController instance
          const controller = createController()
          const signal = controller.signal

          // Build URL, add cache=false parameter if forceRefresh is true
          const url = new URL(`https://dailyhotpage-lac.vercel.app/${endpointName}`)
          if (forceRefresh) {
            url.searchParams.append("cache", "false")
          }

          // Use Promise.race with explicit timeout Promise instead of relying on AbortSignal.timeout
          // This gives us better control over timeout behavior and error messages
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

          // Use Promise.race between timeout and successful request
          const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

          if (!response.ok) {
            const errorMessage = `API returned ${response.status}: ${response.statusText}`
            console.warn(errorMessage)

            // If this is the last endpoint attempt, store the error
            if (endpointName === endpointNames[endpointNames.length - 1] && isMountedRef.current) {
              setPlatformErrors((prev) => ({
                ...prev,
                [platform]: response.status === 404 ? "此平台暂不支持" : errorMessage,
              }))
            }

            // Continue trying next endpoint name
            continue
          }

          const data = await response.json()

          // Check if response has expected structure
          if (data && typeof data === "object" && Array.isArray(data.data)) {
            if (isMountedRef.current) {
              // Update data immediately, don't wait for other platforms
              setPlatformsData((prev) => {
                const newData = { ...prev, [platform]: data }

                // If we already have some data, consider hiding skeletons
                if (Object.keys(newData).length >= BATCH_SIZE) {
                  // Use setTimeout to ensure state update doesn't block UI rendering
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setShowSkeletons(false)
                    }
                  }, 0)
                }

                return newData
              })

              // Clear previous errors
              setPlatformErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[platform]
                return newErrors
              })

              // If this platform isn't in our available list but is available, add it
              if (!availablePlatforms.includes(endpointName)) {
                setAvailablePlatforms((prev) => [...prev, endpointName])
              }

              // Mark as loading complete immediately
              setLoading((prev) => ({ ...prev, [platform]: false }))
            }

            succeeded = true
            break
          } else {
            console.error(`Invalid data structure for ${platform} using ${endpointName}:`, data)

            // If this is the last endpoint attempt, store the error
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

      // If all attempts failed and we haven't reached max retry count, retry
      if (!succeeded && retryCount < MAX_RETRIES && isMountedRef.current) {
        console.log(`Retrying ${platform} (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
        // Use exponential backoff strategy, increasing wait time with each retry
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

  // Batch load platform data
  const fetchPlatformsInBatches = useCallback(
    async (platforms: string[], forceRefresh = false) => {
      if (!isMountedRef.current) return

      try {
        // If initial load, show skeletons first
        if (isInitialLoad) {
          setShowSkeletons(true)
        }

        // Reduce batch size and increase delay for Safari
        const safariAdjustedBatchSize = isSafari() ? Math.max(1, Math.floor(BATCH_SIZE / 2)) : BATCH_SIZE
        const safariAdjustedBatchDelay = isSafari() ? BATCH_DELAY * 1.5 : BATCH_DELAY

        // Split platforms into batches
        for (let i = 0; i < platforms.length; i += safariAdjustedBatchSize) {
          // Check if still mounted before processing each batch
          if (!isMountedRef.current) break

          const batch = platforms.slice(i, i + safariAdjustedBatchSize)

          // Load platforms in each batch in parallel, but don't wait for all to complete before showing
          // Use Promise.allSettled instead of Promise.all so one request failing doesn't affect others
          const batchPromises = batch.map((platform) => {
            // Only fetch if still mounted
            if (isMountedRef.current) {
              return fetchPlatformData(platform, 0, forceRefresh)
                .then(() => {
                  // After each platform data loads, immediately hide that platform's skeleton
                  if (isMountedRef.current && platformsData[platform]) {
                    // If we already have data, consider hiding skeletons
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

          // Wait for current batch of requests to complete or fail
          await Promise.allSettled(batchPromises)

          // If at least some data has loaded, hide skeletons
          if (isMountedRef.current && Object.keys(platformsData).length > 0) {
            setShowSkeletons(false)
          }

          // Add delay between batches to avoid sending too many requests at once
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

          // Ensure skeletons are hidden after all data loads
          setShowSkeletons(false)
        }
      }
    },
    [fetchPlatformData, platformsData, isInitialLoad],
  )

  // Fetch all platforms with forceRefresh parameter
  const fetchAllPlatforms = useCallback(
    async (forceRefresh = false) => {
      if (!isMountedRef.current) return

      // Show skeletons
      setShowSkeletons(true)

      // First discover which platforms are available
      if (availablePlatforms.length === 0) {
        await discoverAvailablePlatforms()
      }

      // Get list of platforms to load
      const platformsToLoad = Object.keys(platformConfig).filter(
        (platform) => !PROBLEMATIC_PLATFORMS.includes(platform),
      ) // Exclude known problematic platforms

      // Batch load platform data
      await fetchPlatformsInBatches(platformsToLoad, forceRefresh)

      if (isMountedRef.current) {
        setLastUpdated(new Date())
      }
    },
    [availablePlatforms, discoverAvailablePlatforms, fetchPlatformsInBatches],
  )

  // Set up intersection observer to monitor platform card visibility
  useEffect(() => {
    // If browser supports IntersectionObserver
    if ("IntersectionObserver" in window) {
      // Use different config for Safari
      const observerConfig = isSafari()
        ? { rootMargin: "300px", threshold: 0.01 }
        : { rootMargin: "200px", threshold: 0.1 }

      // Track last observer trigger time to prevent frequent triggers
      const lastObserverTriggerTime = 0
      const OBSERVER_DEBOUNCE_TIME = isSafari() ? 1000 : 300 // Use longer debounce time on Safari

      // Create observer
      observerRef.current = new IntersectionObserver((entries) => {
        // Use debounce handling to avoid multiple triggers in short time
        const visiblePlatforms = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-platform"))
          .filter(Boolean) as string[]

        if (visiblePlatforms.length > 0) {
          // Find platforms that need loading (no data and not loading)
          const platformsToLoad = visiblePlatforms.filter(
            (platform) => !platformsData[platform] && !loading[platform] && !platformErrors[platform],
          )

          if (platformsToLoad.length > 0) {
            console.log(`Loading visible platforms: ${platformsToLoad.join(", ")}`)
            // Load at most 2 platforms at once to avoid too many concurrent requests
            fetchPlatformsInBatches(platformsToLoad.slice(0, 2))
          }
        }
      }, observerConfig)

      // Add observation for all platform cards
      Object.entries(platformRefs.current).forEach(([platform, el]) => {
        if (el) {
          el.setAttribute("data-platform", platform)
          observerRef.current?.observe(el)
        }
      })
    }

    return () => {
      // Clean up observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchPlatformsInBatches, platformsData, loading, platformErrors])

  // Get platforms in specified order - optimized with useMemo
  const getOrderedPlatforms = useMemo(() => {
    const filteredPlatforms = Object.entries(platformConfig)
      .filter(([_, config]) => {
        if (activeCategory === null) {
          return true // If no category selected, include all platforms
        } else {
          return config.category === activeCategory // Otherwise, only include platforms in selected category
        }
      })
      .map(([key, config]) => ({ key, config }))

    // If no category selected, arrange in specified order
    if (activeCategory === null) {
      const result: { key: string; config: any }[] = []

      // Add first row specific platforms
      FEATURED_PLATFORMS_ROW1.forEach((platform) => {
        if (platformConfig[platform]) {
          result.push({ key: platform, config: platformConfig[platform] })
        }
      })

      // Add second row specific platforms
      FEATURED_PLATFORMS_ROW2.forEach((platform) => {
        if (platformConfig[platform]) {
          result.push({ key: platform, config: platformConfig[platform] })
        }
      })

      // Add other platforms, grouped by category
      const remainingPlatforms = Object.entries(platformConfig)
        .filter(([key, _]) => !FEATURED_PLATFORMS_ROW1.includes(key) && !FEATURED_PLATFORMS_ROW2.includes(key))
        .sort((a, b) => {
          // Sort by category first
          const categoryA = a[1].category
          const categoryB = b[1].category
          if (categoryA !== categoryB) {
            return categoryA.localeCompare(categoryB)
          }
          // Then sort by name
          return a[1].title.localeCompare(b[1].title)
        })
        .map(([key, config]) => ({ key, config }))

      return [...result, ...remainingPlatforms]
    }

    return filteredPlatforms
  }, [activeCategory])

  // Reset observer when platform list changes
  useEffect(() => {
    if (observerRef.current) {
      // Disconnect all observations first
      observerRef.current.disconnect()

      // Re-observe all platform elements
      Object.entries(platformRefs.current).forEach(([platform, el]) => {
        if (el) {
          el.setAttribute("data-platform", platform)
          observerRef.current?.observe(el)
        }
      })

      console.log("Re-observed all platforms after list change")
    }
  }, [getOrderedPlatforms])

  // Initial load - fix infinite refresh issue
  useEffect(() => {
    // Prevent repeated initialization
    if (isInitialized) return

    // Mark as initialized to ensure this effect only runs once
    setIsInitialized(true)

    // Show skeletons
    setShowSkeletons(true)

    // Only load first screen visible platforms and specific platforms
    const initialPlatforms = [...FEATURED_PLATFORMS_ROW1, ...FEATURED_PLATFORMS_ROW2]

    // First discover available platforms
    const discoverAndLoad = async () => {
      if (!isMountedRef.current) return

      try {
        // Show skeletons, but set short timeout to ensure UI isn't blank for long
        setShowSkeletons(true)

        // Add Safari-specific check to avoid repeated loading
        const isSafariBrowser = isSafari()

        // Add short delay on Safari to avoid immediate loading causing repeated refresh
        if (isSafariBrowser) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        await discoverAvailablePlatforms()

        // Then batch load initial platforms, but don't wait for all to complete before showing
        if (isMountedRef.current) {
          // Prioritize loading first screen visible platforms
          const initialPlatforms = [...FEATURED_PLATFORMS_ROW1, ...FEATURED_PLATFORMS_ROW2]

          // Don't wait for all platforms to load, start loading immediately
          fetchPlatformsInBatches(initialPlatforms).catch((error) => {
            console.error("Error loading initial platforms:", error)
            // Ensure skeletons aren't shown forever even if error occurs
            setShowSkeletons(false)
          })

          // Set short timeout to ensure skeletons are hidden after a while even if API is slow
          setTimeout(() => {
            if (isMountedRef.current && Object.keys(platformsData).length === 0) {
              // If still no data, show friendly message instead of skeletons
              setIsDiscoveringPlatforms(false)
              setShowSkeletons(false)
            }
          }, 5000) // Hide skeletons after 5 seconds if still no data
        }
      } catch (error) {
        console.error("Error during initial load:", error)
        // Ensure skeletons aren't shown forever even if error occurs
        setShowSkeletons(false)
        setIsDiscoveringPlatforms(false)
      }
    }

    discoverAndLoad()

    // Set up polling to auto-refresh data every 5 minutes
    // Add random delay on Safari to avoid exact 5-minute sync issues
    const randomDelay = isSafari() ? Math.floor(Math.random() * 10000) : 0
    const intervalId = setInterval(
      () => {
        if (isMountedRef.current) {
          // Only refresh loaded platforms
          const loadedPlatforms = Object.keys(platformsData)
          if (loadedPlatforms.length > 0) {
            console.log("Auto-refreshing platforms:", loadedPlatforms.length)
            fetchPlatformsInBatches(loadedPlatforms, true)
          }
        }
      },
      5 * 60 * 1000 + randomDelay,
    )

    // Cleanup function
    return () => {
      clearInterval(intervalId)
    }
  }, [isInitialized, discoverAvailablePlatforms, fetchPlatformsInBatches, platformsData]) // Only depend on isInitialized to ensure it only runs once

  const formatNumber = useCallback((num: number) => {
    // Ensure num is a number
    const numValue = typeof num === "string" ? Number(num) : num

    if (numValue >= 10000) {
      return `${(numValue / 10000).toFixed(1)}万`
    }
    return numValue.toString()
  }, [])

  // Count platforms in each category - optimized with useMemo
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: Object.keys(platformConfig).length }

    Object.values(platformConfig).forEach((config) => {
      const category = config.category as string
      counts[category] = (counts[category] || 0) + 1
    })

    return counts
  }, [])

  // Handle pagination
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

  // Get current page data
  const getPaginatedData = useCallback(
    (data: Topic[]) => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      return data.slice(startIndex, endIndex)
    },
    [currentPage],
  )

  // Handle topic hover with optimized position calculation
  const handleTopicHover = useCallback((topic: Topic, element: HTMLElement) => {
    // Clear previous timer
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Set short delay to avoid showing preview when mouse quickly passes over
    hoverTimeoutRef.current = setTimeout(() => {
      // Don't show preview if title is empty
      if (!topic.title) return

      // Calculate best position for hover box
      const hasExtraContent = topic.desc || topic.author || topic.timestamp
      const previewHeight = hasExtraContent ? 150 : 80
      const position = calculateHoverPosition(element, 300, previewHeight)

      setHoverPosition(position)
      setHoveredTopic(topic)
    }, getHoverDelay(200))
  }, [])

  const handleTopicLeave = useCallback(() => {
    // Clear timer
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Set short delay to avoid flickering when mouse moves between preview and item
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTopic(null)
    }, getHoverDelay(50))
  }, [])

  // Render floating card
  const renderExpandedCard = useCallback(() => {
    if (!expandedPlatform) return null

    const config = platformConfig[expandedPlatform]
    if (!config) return null

    const hasData =
      platformsData[expandedPlatform] &&
      platformsData[expandedPlatform]?.data &&
      platformsData[expandedPlatform]?.data.length > 0

    // Calculate pagination info
    const totalItems = hasData ? platformsData[expandedPlatform]?.data.length || 0 : 0
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    // Get current page data
    const paginatedData = hasData ? getPaginatedData(platformsData[expandedPlatform]?.data || []) : []

    // Calculate maximum hot value in current page for normalizing heat bars
    const maxHotValue = paginatedData.reduce((max, topic) => {
      return topic.hot && Number(topic.hot) > max ? Number(topic.hot) : max
    }, 0)

    // Check if platform is unsupported
    const errorMessage = platformErrors[expandedPlatform]
    const isUnsupported = errorMessage === "此平台暂不支持" || errorMessage === "此平台暂时不可用"

    // Generate page numbers array
    const getPageNumbers = () => {
      const pageNumbers = []
      const maxPageButtons = 5 // Maximum number of page buttons to show

      if (totalPages <= maxPageButtons) {
        // If total pages is less than or equal to max buttons, show all pages
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // Otherwise, show pages near current page
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
        let endPage = startPage + maxPageButtons - 1

        if (endPage > totalPages) {
          endPage = totalPages
          startPage = Math.max(1, endPage - maxPageButtons + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i)
        }

        // Add ellipsis
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

    // Use lighter animation config
    const modalAnimation = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    }

    // Get relative time display for update time
    const updateTimeDisplay = platformsData[expandedPlatform]?.updateTime
      ? formatRelativeTime(platformsData[expandedPlatform]?.updateTime || "")
      : "未知时间"

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

            {/* Move bottom buttons to top right and add update time */}
            <div className="flex items-center gap-2">
              {platformsData[expandedPlatform]?.updateTime && (
                <span className="text-xs text-muted-foreground mr-2">{updateTimeDisplay}</span>
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
                  // Calculate actual index for determining rank style
                  const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index

                  // Calculate heat percentage for heat bar width and color
                  const hotPercentage = topic.hot && maxHotValue ? Number(topic.hot) / maxHotValue : 0
                  const heatColorClass = getHeatColorClass(hotPercentage)

                  return (
                    <li
                      key={index}
                      className="group relative overflow-hidden rounded-md transition-all duration-200"
                      onMouseEnter={(e) => {
                        const target = e.target as HTMLElement
                        const listItem = target.closest("li") as HTMLElement
                        if (listItem) {
                          handleTopicHover(topic, listItem)
                        }
                      }}
                      onMouseLeave={handleTopicLeave}
                      style={{ touchAction: "manipulation" }} // Optimize mobile response
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
                                  {/* Heat value number display */}
                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatNumber(Number(topic.hot))}
                                    </span>
                                  </div>
                                  {/* Heat bar visualization */}
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

          {/* Optimized pagination controller */}
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

  // Use throttle function to optimize scroll handling
  const handleScroll = useCallback(
    throttle(() => {
      // Scroll handling logic
      console.log("Scroll event throttled")
    }, 100),
    [],
  )

  // Use debounce function to optimize search handling
  const handleSearch = useCallback(
    debounce((term: string) => {
      // Search handling logic
      console.log("Search debounced:", term)
      setSearchDialogOpen(true)
    }, 300),
    [],
  )

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // Render skeletons - use dynamic column count
  const renderSkeletons = () => {
    // Calculate number of skeletons to show based on current column count
    const skeletonCount = Math.min(layout.columns * 3, 15) // At most 3 rows, at most 15 skeletons

    return (
      <div
        className="grid gap-3 animate-fade-in stagger-animation"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          width: "100%",
        }}
      >
        {Array(skeletonCount)
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
        {/* Top layout */}
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
      {/* New top layout */}
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
            onClick={() => fetchAllPlatforms(false)} // Change to not force refresh
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

      {/* Show skeletons or actual content */}
      {showSkeletons ? (
        renderSkeletons()
      ) : (
        <div
          className="grid gap-3 stagger-animation animate-fade-in-up"
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
            width: "100%",
          }}
        >
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
                onRefresh={() => fetchPlatformData(key, 0, true)} // Content block refresh button uses force refresh
                onExpand={() => setExpandedPlatform(key)}
                isInitialLoad={isInitialLoad}
                onTopicHover={handleTopicHover}
                onTopicLeave={handleTopicLeave}
              />
            </div>
          ))}
        </div>
      )}

      {/* Floating card */}
      <AnimatePresence>{expandedPlatform && renderExpandedCard()}</AnimatePresence>

      {/* Hover preview */}
      <AnimatePresence>
        {hoveredTopic && (
          <motion.div
            key="hover-preview"
            initial={{ opacity: 0, y: isSafari() ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isSafari() ? 0.1 : 0.15 }}
            className="fixed z-[9999] bg-card border rounded-lg shadow-lg p-3 max-w-sm"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`,
              pointerEvents: "none", // Ensure hover box doesn't block mouse events
              minWidth: "200px", // Ensure minimum width
              transform: "translateZ(0)", // Force hardware acceleration
              willChange: "transform, opacity", // Hint browser to optimize
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

      {/* Search dialog */}
      <SearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} platformsData={platformsData} />
    </div>
  )
}
