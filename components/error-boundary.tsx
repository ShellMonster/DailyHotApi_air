"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级 UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 否则使用默认的错误 UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">出错了</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || "应用程序发生了错误，请尝试刷新页面"}
          </p>
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
