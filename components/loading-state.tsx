import { RefreshCw } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "正在加载数据..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="relative">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <div
          className="absolute inset-0 animate-pulse-opacity rounded-full bg-primary/10"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="absolute inset-0 animate-pulse-opacity rounded-full bg-primary/10"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
