"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3, Hash, Clock, Search, Download } from "lucide-react"
import type { PlatformData, KeywordAnalysisResult } from "@/types"
import { platformConfig } from "@/config/platforms"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// 中文停用词列表
const CHINESE_STOPWORDS = new Set([
  "的",
  "了",
  "和",
  "是",
  "在",
  "我",
  "有",
  "不",
  "这",
  "也",
  "就",
  "都",
  "而",
  "要",
  "把",
  "你",
  "会",
  "对",
  "等",
  "被",
  "让",
  "给",
  "但",
  "从",
  "到",
  "为",
  "与",
  "他",
  "她",
  "它",
  "们",
  "个",
  "之",
  "很",
  "种",
  "样",
  "那",
  "如何",
  "什么",
  "怎么",
  "一个",
  "没有",
  "可以",
  "自己",
  "这个",
  "那个",
  "这些",
  "那些",
  "为什么",
  "如何",
  "多少",
  "哪些",
  "如果",
  "因为",
  "所以",
  "但是",
  "然后",
  "现在",
  "已经",
  "正在",
  "还有",
  "只有",
  "一些",
  "许多",
  "几个",
  "大家",
  "每个",
  "所有",
  "一下",
  "一直",
  "一定",
  "一样",
  "一般",
  "一种",
  "一起",
  "一边",
  "一面",
  "万一",
  "上下",
  "不仅",
  "不但",
  "不光",
  "不单",
  "不只",
  "不如",
  "不妨",
  "不尽",
  "不常",
  "不得",
  "不怕",
  "不惟",
  "不成",
  "不拘",
  "不料",
  "不是",
  "不比",
  "不然",
  "不特",
  "不独",
  "不管",
  "不至于",
  "不若",
  "不论",
  "不过",
  "不问",
  "与其",
  "与否",
  "且不说",
  "且说",
  "两者",
  "个别",
  "临到",
  "为了",
  "为止",
  "为此",
  "为着",
  "乃至",
  "乃至于",
  "么",
  "之一",
  "之前",
  "之后",
  "之後",
  "之所以",
  "之类",
  "乌乎",
  "乎",
  "乘",
  "也好",
  "也罢",
  "了",
  "二来",
  "于",
  "于是",
  "于是乎",
  "云云",
  "云尔",
  "些",
  "亦",
  "人",
  "人们",
  "人家",
  "今",
  "介于",
  "仍",
  "仍旧",
  "从",
  "从而",
  "他",
  "他人",
  "他们",
  "以",
  "以上",
  "以为",
  "以便",
  "以免",
  "以及",
  "以故",
  "以期",
  "以来",
  "以至",
  "以至于",
  "以致",
  "们",
  "任",
  "任何",
  "任凭",
  "似的",
  "但",
  "但凡",
  "但是",
  "何",
  "何以",
  "何况",
  "何处",
  "何时",
  "余外",
  "作为",
  "你",
  "你们",
  "使",
  "使得",
  "例如",
  "依",
  "依据",
  "依照",
  "便于",
  "俺",
  "俺们",
  "倘",
  "倘使",
  "倘或",
  "倘然",
  "倘若",
  "借",
  "假使",
  "假如",
  "假若",
  "傥然",
  "像",
  "儿",
  "先不先",
  "光是",
  "全体",
  "全部",
  "兮",
  "关于",
  "其",
  "其一",
  "其中",
  "其二",
  "其他",
  "其余",
  "其它",
  "其次",
  "具体地说",
  "具体说来",
  "兼之",
  "内",
  "再",
  "再其次",
  "再则",
  "再有",
  "再者",
  "再者说",
  "再说",
  "冒",
  "冲",
  "况且",
  "几",
  "几时",
  "凡",
  "凡是",
  "凭",
  "凭借",
  "出于",
  "出来",
  "分别",
  "则",
  "则甚",
  "别",
  "别人",
  "别处",
  "别是",
  "别的",
  "别管",
  "别说",
  "到",
  "前后",
  "前此",
  "前者",
  "加之",
  "加以",
  "即",
  "即令",
  "即使",
  "即便",
  "即如",
  "即或",
  "即若",
  "却",
  "去",
  "又",
  "又及",
  "及",
  "及其",
  "及至",
  "反之",
  "反而",
  "反过来",
  "反过来说",
  "受到",
  "另",
  "另一方面",
  "另外",
  "另悉",
  "只",
  "只当",
  "只怕",
  "只是",
  "只有",
  "只消",
  "只要",
  "只限",
  "叫",
  "叮咚",
  "可",
  "可以",
  "可是",
  "可见",
  "各",
  "各个",
  "各位",
  "各种",
  "各自",
  "同",
  "同时",
  "后",
  "后者",
  "向",
  "向使",
  "向着",
  "吓",
  "吗",
  "否则",
  "吧",
  "吧哒",
  "吱",
  "呀",
  "呃",
  "呕",
  "呗",
  "呜",
  "呜呼",
  "呢",
  "呵",
  "呵呵",
  "呸",
  "呼哧",
  "咋",
  "和",
  "咚",
  "咦",
  "咧",
  "咱",
  "咱们",
  "咳",
  "哇",
  "哈",
  "哈哈",
  "哉",
  "哎",
  "哎呀",
  "哎哟",
  "哗",
  "哟",
  "哦",
  "哩",
  "哪",
  "哪个",
  "哪些",
  "哪儿",
  "哪天",
  "哪年",
  "哪怕",
  "哪样",
  "哪边",
  "哪里",
  "哼",
  "哼唷",
  "唉",
  "唯有",
  "啊",
  "啐",
  "啥",
  "啦",
  "啪达",
  "啷当",
  "喂",
  "喏",
  "喔唷",
  "喽",
  "嗡",
  "嗡嗡",
  "嗬",
  "嗯",
  "嗳",
  "嘎",
  "嘎登",
  "嘘",
  "嘛",
  "嘻",
  "嘿",
  "因",
  "因为",
  "因了",
  "因此",
  "因着",
  "因而",
  "固然",
  "在",
  "在下",
  "在于",
  "地",
  "基于",
  "处在",
  "多",
  "多么",
  "多少",
  "大",
  "大家",
  "她",
  "她们",
  "好",
  "如",
  "如上",
  "如上所述",
  "如下",
  "如何",
  "如其",
  "如同",
  "如是",
  "如果",
  "如此",
  "如若",
  "始而",
  "孰料",
  "孰知",
  "宁",
  "宁可",
  "宁愿",
  "宁肯",
  "它",
  "它们",
  "对",
  "对于",
  "对待",
  "对方",
  "对比",
  "将",
  "小",
  "尔",
  "尔后",
  "尔尔",
  "尚且",
  "就",
  "就是",
  "就是了",
  "就是说",
  "就算",
  "就要",
  "尽",
  "尽管",
  "尽管如此",
  "岂但",
  "己",
  "已",
  "已矣",
  "巴",
  "巴巴",
  "并",
  "并且",
  "并非",
  "庶乎",
  "庶几",
  "开外",
  "开始",
  "归",
  "归齐",
  "当",
  "当地",
  "当然",
  "当着",
  "彼",
  "彼时",
  "彼此",
  "往",
  "待",
  "很",
  "得",
  "得了",
  "怎",
  "怎么",
  "怎么办",
  "怎么样",
  "怎奈",
  "怎样",
  "总之",
  "总的来看",
  "总的来说",
  "总的说来",
  "总而言之",
  "恰恰相反",
  "您",
  "惟其",
  "慢说",
  "我",
  "我们",
  "或",
  "或则",
  "或是",
  "或曰",
  "或者",
  "截至",
  "所",
  "所以",
  "所在",
  "所幸",
  "所有",
  "才",
  "才能",
  "打",
  "打从",
  "把",
  "抑或",
  "拿",
  "按",
  "按照",
  "换句话说",
  "换言之",
  "据",
  "据此",
  "接着",
  "故",
  "故此",
  "故而",
  "旁人",
  "无",
  "无宁",
  "无论",
  "既",
  "既往",
  "既是",
  "既然",
  "日",
  "时",
  "时候",
  "是",
  "是以",
  "是的",
  "更",
  "曾",
  "替",
  "替代",
  "最",
  "有",
  "有些",
  "有关",
  "有及",
  "有时",
  "有的",
  "望",
  "朝",
  "朝着",
  "本",
  "本人",
  "本地",
  "本着",
  "本身",
  "来",
  "来着",
  "来自",
  "来说",
  "极了",
  "果然",
  "果真",
  "某",
  "某个",
  "某些",
  "某某",
  "根据",
  "欤",
  "正值",
  "正如",
  "正巧",
  "正是",
  "此",
  "此地",
  "此处",
  "此外",
  "此时",
  "此次",
  "此间",
  "毋宁",
  "每",
  "每当",
  "比",
  "比及",
  "比如",
  "比方",
  "没奈何",
  "沿",
  "沿着",
  "漫说",
  "焉",
  "然则",
  "然后",
  "然而",
  "照",
  "照着",
  "犹且",
  "犹自",
  "甚且",
  "甚么",
  "甚或",
  "甚而",
  "甚至",
  "甚至于",
  "用",
  "用来",
  "由",
  "由于",
  "由是",
  "由此",
  "由此可见",
  "的",
  "的确",
  "的话",
  "直到",
  "相对而言",
  "省得",
  "看",
  "眨眼",
  "着",
  "着呢",
  "矣",
  "矣乎",
  "矣哉",
  "离",
  "竟而",
  "第",
  "等",
  "等到",
  "等等",
  "简言之",
  "管",
  "类如",
  "紧接着",
  "纵",
  "纵令",
  "纵使",
  "纵然",
  "经",
  "经过",
  "结果",
  "给",
  "继之",
  "继后",
  "继而",
  "综上所述",
  "罢了",
  "者",
  "而",
  "而且",
  "而况",
  "而后",
  "而外",
  "而已",
  "而是",
  "而言",
  "能",
  "能否",
  "腾",
  "自",
  "自个儿",
  "自从",
  "自各儿",
  "自后",
  "自家",
  "自己",
  "自打",
  "自身",
  "至",
  "至于",
  "至今",
  "至若",
  "致",
  "般的",
  "若",
  "若夫",
  "若是",
  "若果",
  "若非",
  "莫不然",
  "莫如",
  "莫若",
  "虽",
  "虽则",
  "虽然",
  "虽说",
  "被",
  "要",
  "要不",
  "要不是",
  "要不然",
  "要么",
  "要是",
  "譬喻",
  "譬如",
  "让",
  "许多",
  "论",
  "设使",
  "设或",
  "设若",
  "诚如",
  "诚然",
  "该",
  "说",
  "说来",
  "请",
  "诸",
  "诸位",
  "诸如",
  "谁",
  "谁人",
  "谁料",
  "谁知",
  "贼死",
  "赖以",
  "赶",
  "起",
  "起见",
  "趁",
  "趁着",
  "越是",
  "距",
  "跟",
  "较",
  "较之",
  "边",
  "过",
  "还",
  "还是",
  "还有",
  "还要",
  "这",
  "这一来",
  "这个",
  "这么",
  "这么些",
  "这么样",
  "这么点儿",
  "这些",
  "这会儿",
  "这儿",
  "这就是说",
  "这时",
  "这样",
  "这次",
  "这般",
  "这边",
  "这里",
  "进而",
  "连",
  "连同",
  "逐步",
  "通过",
  "遵循",
  "遵照",
  "那",
  "那个",
  "那么",
  "那么些",
  "那么样",
  "那些",
  "那会儿",
  "那儿",
  "那时",
  "那样",
  "那般",
  "那边",
  "那里",
  "都",
  "鄙人",
  "鉴于",
  "针对",
  "阿",
  "除",
  "除了",
  "除外",
  "除开",
  "除此之外",
  "除非",
  "随",
  "随后",
  "随时",
  "随着",
  "难道说",
  "非但",
  "非徒",
  "非特",
  "非独",
  "靠",
  "顺",
  "顺着",
  "首先",
  "！",
  "，",
  "：",
  "；",
  "？",
  // 添加一些常见的无意义词组
  "来了",
  "连送第",
  "第一",
  "第二",
  "第三",
  "第四",
  "第五",
  "第六",
  "第七",
  "第八",
  "第九",
  "第十",
  "一起",
  "一下",
  "一个",
  "一些",
  "一点",
  "一种",
  "一项",
  "一名",
  "一位",
  "一批",
  "一系列",
  "一场",
  "终于",
  "突然",
  "立即",
  "马上",
  "顿时",
  "瞬间",
  "刹那",
  "霎时",
  "立刻",
  "即刻",
  "随即",
  "当即",
  "当天",
  "当日",
  "当年",
  "当月",
  "当周",
  "当季",
  "当时",
  "当下",
  "当场",
  "当面",
  "当真",
  "当然",
  "表示",
  "认为",
  "指出",
  "强调",
  "说明",
  "解释",
  "声明",
  "宣布",
  "透露",
  "坦言",
  "坦承",
  "承认",
  "否认",
  "反驳",
  "批评",
  "谴责",
  "抨击",
  "赞扬",
  "称赞",
  "夸奖",
  "表扬",
  "肯定",
  "赞同",
  "支持",
  "反对",
  "质疑",
  "怀疑",
  "猜测",
  "推测",
  "估计",
  "预计",
  "预测",
  "预期",
  "预想",
  "预见",
  "预言",
])

interface KeywordAnalysisProps {
  platformsData: Record<string, PlatformData | null>
}

export function KeywordAnalysis({ platformsData }: KeywordAnalysisProps) {
  const [historicalData, setHistoricalData] = useState<
    {
      timestamp: number
      keywords: Record<string, { count: number; hotValue: number }>
    }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("frequency")
  const [analysisResults, setAnalysisResults] = useState<KeywordAnalysisResult[]>([])
  const [topPlatforms, setTopPlatforms] = useState<{ platform: string; title: string; count: number }[]>([])
  const [trendingKeywords, setTrendingKeywords] = useState<KeywordAnalysisResult[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredResults, setFilteredResults] = useState<KeywordAnalysisResult[]>([])
  const isInitialMount = useRef(true)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  // 从本地存储加载历史数据 - 只在组件挂载时执行一次
  useEffect(() => {
    let historicalData: {
      timestamp: number
      keywords: Record<string, { count: number; hotValue: number }>
    }[] = []

    try {
      const savedData = localStorage.getItem("keywordHistoricalData")
      historicalData = savedData ? JSON.parse(savedData) : []
    } catch (e) {
      console.error("Failed to parse historical keyword data:", e)
    }

    setHistoricalData(historicalData)
    setIsLoading(false)
    setHasLoadedInitialData(true)
  }, [])

  // 简单的中文分词函数 - 不依赖WebAssembly
  const simpleCutChinese = (text: string): string[] => {
    if (!text) return []

    // 1. 按标点符号和空格分割
    const segments = text.split(/[\s\p{P}]+/u).filter(Boolean)

    // 2. 提取2-4个字符的词组
    const words: string[] = []

    segments.forEach((segment) => {
      // 对于短句子，直接添加
      if (segment.length <= 4) {
        words.push(segment)
        return
      }

      // 对于长句子，提取2-4字词组
      for (let i = 0; i < segment.length; i++) {
        // 提取2字词
        if (i + 1 < segment.length) {
          const word2 = segment.substring(i, i + 2)
          words.push(word2)
        }

        // 提取3字词
        if (i + 2 < segment.length) {
          const word3 = segment.substring(i, i + 3)
          words.push(word3)
        }

        // 提取4字词
        if (i + 3 < segment.length) {
          const word4 = segment.substring(i, i + 4)
          words.push(word4)
        }
      }
    })

    return words
  }

  // 提取关键词
  const extractKeywords = (text: string): string[] => {
    try {
      // 使用简单的中文分词
      const words = simpleCutChinese(text)

      // 过滤停用词和单字词（除非是数字）
      return words.filter((word) => {
        // 过滤空字符串
        if (!word.trim()) return false

        // 保留数字和数字+单位的组合
        if (/\d+/.test(word)) return true

        // 过滤停用词
        if (CHINESE_STOPWORDS.has(word.toLowerCase())) return false

        // 过滤单字词（大多数情况下单字词不是好的关键词）
        if (word.length === 1) return false

        return true
      })
    } catch (error) {
      console.error("Error in extractKeywords:", error)
      return []
    }
  }

  // 当platformsData或historicalData变化时，重新分析关键词
  useEffect(() => {
    if (!hasLoadedInitialData) return

    if (Object.keys(platformsData).length === 0) {
      setAnalysisResults([])
      setTopPlatforms([])
      setTrendingKeywords([])
      return
    }

    // 收集所有热搜标题
    const allTitles: { title: string; platform: string; hot?: number }[] = []
    Object.entries(platformsData).forEach(([platform, data]) => {
      if (!data || !data.data || !Array.isArray(data.data)) return

      data.data.forEach((topic) => {
        if (topic.title) {
          allTitles.push({
            title: topic.title,
            platform,
            hot: topic.hot,
          })
        }
      })
    })

    // 提取关键词
    const keywordMap: Record<string, { count: number; platforms: Set<string>; hotValue: number }> = {}

    allTitles.forEach(({ title, platform, hot }) => {
      // 使用简单分词
      const words = extractKeywords(title)

      words.forEach((word) => {
        if (!keywordMap[word]) {
          keywordMap[word] = { count: 0, platforms: new Set(), hotValue: 0 }
        }
        keywordMap[word].count += 1
        keywordMap[word].platforms.add(platform)
        if (hot) {
          keywordMap[word].hotValue += hot
        }
      })
    })

    // 转换为数组并排序
    const currentKeywords = Object.entries(keywordMap)
      .map(([keyword, { count, platforms, hotValue }]) => ({
        keyword,
        count,
        platforms: Array.from(platforms),
        hotValue,
        trend: "stable" as "up" | "down" | "stable",
      }))
      .filter((item) => item.count > 1) // 只保留出现次数大于1的关键词
      .sort((a, b) => b.count - a.count)
      .slice(0, 100) // 只取前100个关键词

    // 分析趋势
    if (historicalData.length > 0) {
      const lastData = historicalData[historicalData.length - 1]

      currentKeywords.forEach((item) => {
        const previousData = lastData.keywords[item.keyword]
        if (previousData) {
          if (item.count > previousData.count * 1.2) {
            item.trend = "up"
          } else if (item.count < previousData.count * 0.8) {
            item.trend = "down"
          } else {
            item.trend = "stable"
          }
        } else {
          item.trend = "up" // 新出现的关键词
        }
      })
    }

    // 更新分析结果
    setAnalysisResults(currentKeywords)
    setFilteredResults(currentKeywords)

    // 计算热门平台
    const platformCounts: Record<string, number> = {}
    currentKeywords.forEach((item) => {
      item.platforms.forEach((platform) => {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1
      })
    })

    const topPlatforms = Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([platform, count]) => ({
        platform,
        title: platformConfig[platform]?.title || platform,
        count,
      }))

    setTopPlatforms(topPlatforms)

    // 计算上升最快的关键词
    const trendingKeywords = currentKeywords
      .filter((item) => item.trend === "up")
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setTrendingKeywords(trendingKeywords)
  }, [platformsData, historicalData, hasLoadedInitialData])

  // 保存当前数据到历史记录 - 使用单独的useEffect，只在分析结果变化时执行
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (analysisResults.length === 0 || isLoading) return

    // 检查是否需要保存新的历史记录
    const shouldSaveNewRecord = () => {
      if (historicalData.length === 0) return true

      const lastRecord = historicalData[historicalData.length - 1]
      const timeSinceLastRecord = Date.now() - lastRecord.timestamp

      // 如果距离上次记录超过5分钟，保存新记录
      return timeSinceLastRecord > 5 * 60 * 1000
    }

    if (!shouldSaveNewRecord()) return

    // 保存当前数据到历史记录
    const currentData = {
      timestamp: Date.now(),
      keywords: Object.fromEntries(
        analysisResults.map((item) => [item.keyword, { count: item.count, hotValue: item.hotValue }]),
      ),
    }

    // 只保留最近24小时的数据（假设每5分钟更新一次，最多保存288条记录）
    const newHistoricalData = [...historicalData, currentData]
      .filter((data) => Date.now() - data.timestamp < 24 * 60 * 60 * 1000)
      .slice(-288)

    // 保存到本地存储
    try {
      localStorage.setItem("keywordHistoricalData", JSON.stringify(newHistoricalData))
      setHistoricalData(newHistoricalData)
    } catch (e) {
      console.error("Failed to save historical keyword data:", e)
    }
  }, [analysisResults, isLoading])

  // 处理搜索
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults(analysisResults)
      return
    }

    const filtered = analysisResults.filter((item) => item.keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredResults(filtered)
  }, [searchTerm, analysisResults])

  // 导出CSV
  const exportToCSV = () => {
    const headers = ["关键词", "出现次数", "热度值", "趋势", "平台"]
    const rows = filteredResults.map((item) => [
      item.keyword,
      item.count.toString(),
      item.hotValue.toString(),
      item.trend === "up" ? "上升" : item.trend === "down" ? "下降" : "稳定",
      item.platforms.map((p) => platformConfig[p]?.title || p).join(", "),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `热搜关键词分析_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 渲染趋势图标
  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">热搜关键词分析</CardTitle>
          <CardDescription>正在分析热搜关键词...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">热搜关键词分析</CardTitle>
        <CardDescription>分析各平台热搜中的关键词频率和热度变化</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="relative flex-1 mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索关键词..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>导出CSV</span>
          </Button>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="frequency" className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              <span>关键词频率</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>热门趋势</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>平台分布</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frequency" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {searchTerm ? (
                  <>找到 {filteredResults.length} 个匹配的关键词</>
                ) : (
                  <>共分析 {analysisResults.length} 个关键词，显示频率最高的前 30 个</>
                )}
              </div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="flex flex-wrap gap-2">
                  {(searchTerm ? filteredResults : filteredResults.slice(0, 30)).map((item) => (
                    <Badge key={item.keyword} variant="outline" className="flex items-center gap-1 py-1 px-2 text-xs">
                      {item.keyword}
                      <span className="ml-1 text-[10px] text-muted-foreground">({item.count})</span>
                      {renderTrendIcon(item.trend)}
                    </Badge>
                  ))}
                  {filteredResults.length === 0 && (
                    <div className="flex h-20 w-full items-center justify-center text-sm text-muted-foreground">
                      未找到匹配的关键词
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">上升最快的热搜关键词</div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {trendingKeywords.length > 0 ? (
                    trendingKeywords.map((item, index) => (
                      <div key={item.keyword} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.keyword}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.count} 次提及</span>
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      暂无上升趋势的关键词
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="platforms" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">关键词分布最多的平台</div>
              <div className="space-y-3">
                {topPlatforms.map((item) => (
                  <div key={item.platform} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      {platformConfig[item.platform]?.icon && (
                        <div className="h-4 w-4">
                          {React.createElement(platformConfig[item.platform].icon, { className: "h-4 w-4" })}
                        </div>
                      )}
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.count} 个关键词</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>数据更新于: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
