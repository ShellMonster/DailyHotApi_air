import type React from "react"
export interface Topic {
  title: string
  desc?: string
  author?: string
  timestamp?: string | null
  hot?: number
  url?: string
  mobileUrl?: string
}

export interface PlatformData {
  code: number
  name: string
  title: string
  type: string
  description: string
  link: string
  total: number
  updateTime: string
  fromCache: boolean
  data: Topic[]
}

export interface Category {
  id: string
  name: string
  icon: React.ComponentType
  description: string
}

export interface KeywordAnalysisResult {
  keyword: string
  count: number
  platforms: string[]
  trend: "up" | "down" | "stable"
  hotValue: number
}
