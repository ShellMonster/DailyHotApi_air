"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X, ExternalLink, History, Trash2 } from "lucide-react"
import { platformConfig } from "@/config/platforms"
import type { PlatformData, Topic } from "@/types"

interface SearchResult extends Topic {
  platform: string
  platformTitle: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platformsData: Record<string, PlatformData | null>
}

export function SearchDialog({ open, onOpenChange, platformsData }: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 从本地存储加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory")
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to parse search history:", e)
      }
    }
  }, [])

  // 保存搜索历史到本地存储
  const saveSearchHistory = (history: string[]) => {
    try {
      localStorage.setItem("searchHistory", JSON.stringify(history))
    } catch (e) {
      console.error("Failed to save search history:", e)
    }
  }

  // 添加搜索词到历史记录
  const addToHistory = (term: string) => {
    if (!term.trim()) return

    const newHistory = [term, ...searchHistory.filter((item) => item !== term)].slice(0, 10) // 只保留最近10条记录

    setSearchHistory(newHistory)
    saveSearchHistory(newHistory)
  }

  // 清除搜索历史
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
  }

  // 从历史记录中删除一项
  const removeFromHistory = (term: string) => {
    const newHistory = searchHistory.filter((item) => item !== term)
    setSearchHistory(newHistory)
    saveSearchHistory(newHistory)
  }

  // 执行搜索
  const performSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    // 将搜索词添加到历史记录
    addToHistory(term)

    // 准备搜索结果
    const results: SearchResult[] = []

    // 遍历所有平台数据
    Object.entries(platformsData).forEach(([platform, data]) => {
      if (!data || !data.data || !Array.isArray(data.data)) return

      // 在平台数据中搜索匹配项
      const platformResults = data.data
        .filter((topic) => {
          const searchLower = term.toLowerCase()
          const titleMatch = topic.title?.toLowerCase().includes(searchLower)
          const descMatch = topic.desc?.toLowerCase().includes(searchLower)
          return titleMatch || descMatch
        })
        .map((topic) => ({
          ...topic,
          platform,
          platformTitle: platformConfig[platform]?.title || data.title || platform,
        }))

      results.push(...platformResults)
    })

    // 按平台分组并限制每个平台最多显示5个结果
    const groupedResults: Record<string, SearchResult[]> = {}
    results.forEach((result) => {
      if (!groupedResults[result.platform]) {
        groupedResults[result.platform] = []
      }
      if (groupedResults[result.platform].length < 5) {
        groupedResults[result.platform].push(result)
      }
    })

    // 将分组结果展平为一个数组
    const flatResults = Object.values(groupedResults).flat()

    setSearchResults(flatResults)
    setIsSearching(false)
  }

  // 当搜索词变化时执行搜索
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, platformsData])

  // 当对话框关闭时重置搜索状态
  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setSearchResults([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center">搜索热搜内容</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="输入关键词搜索所有平台热搜..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">清除</span>
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          {searchTerm ? (
            <ScrollArea className="h-[calc(60vh-100px)] sm:h-[400px] pr-4">
              {isSearching ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="animate-pulse text-sm text-muted-foreground">搜索中...</div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4 py-4">
                  <div className="text-sm text-muted-foreground">找到 {searchResults.length} 条相关结果</div>
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.platform}-${index}`}
                        className="group rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-normal">
                            {result.platformTitle}
                          </Badge>
                          {result.hot && (
                            <span className="text-xs text-muted-foreground">{result.hot.toLocaleString()} 热度</span>
                          )}
                        </div>
                        <a
                          href={result.url || result.mobileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h3 className="flex items-start justify-between font-medium">
                            <span className="line-clamp-2">{result.title}</span>
                            <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </h3>
                          {result.desc && result.desc !== result.title && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{result.desc}</p>
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-20 flex-col items-center justify-center gap-2">
                  <div className="text-sm text-muted-foreground">未找到相关结果</div>
                  <p className="text-xs text-muted-foreground">尝试使用不同的关键词</p>
                </div>
              )}
            </ScrollArea>
          ) : searchHistory.length > 0 ? (
            <div className="py-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span>搜索历史</span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 text-xs">
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  清除历史
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <div key={term} className="group flex items-center rounded-full bg-muted px-3 py-1 text-xs">
                    <button onClick={() => setSearchTerm(term)} className="mr-1">
                      {term}
                    </button>
                    <button
                      onClick={() => removeFromHistory(term)}
                      className="rounded-full p-0.5 opacity-50 transition-opacity hover:bg-background hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">删除</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center">
              <div className="text-sm text-muted-foreground">输入关键词开始搜索</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
