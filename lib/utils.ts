import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将时间戳格式化为可读的日期时间字符串
 * @param timestamp 时间戳字符串或数字
 * @returns 格式化后的日期时间字符串，如果不是有效时间戳则返回原值
 */
export function formatTimestamp(timestamp: string | number | null): string | null {
  if (timestamp === null || timestamp === undefined) return null

  // 将数字转换为字符串
  const timestampStr = typeof timestamp === "number" ? String(timestamp) : timestamp

  // 检查是否为数字字符串
  if (/^\d+$/.test(timestampStr)) {
    const num = Number.parseInt(timestampStr, 10)
    // 判断是秒级还是毫秒级时间戳
    const date = new Date(num < 10000000000 ? num * 1000 : num)

    // 检查日期是否有效
    if (isNaN(date.getTime())) return timestampStr

    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  // 如果不是数字字符串，则保持原样
  return timestampStr
}

/**
 * 将时间戳格式化为相对时间（几分钟前、几小时前等）
 * @param timestamp ISO格式的时间戳或Date对象
 * @returns 格式化后的相对时间字符串
 */
export function formatRelativeTime(timestamp: string | Date | number): string {
  if (!timestamp) return "未知时间"

  const date = typeof timestamp === "string" || typeof timestamp === "number" ? new Date(timestamp) : timestamp

  // 检查日期是否有效
  if (isNaN(date.getTime())) return "未知时间"

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // 小于1分钟
  if (diffInSeconds < 60) {
    return "刚刚更新"
  }

  // 小于1小时
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前更新`
  }

  // 小于24小时
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前更新`
  }

  // 超过24小时，显示具体时间
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
