import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { isSafari } from "@/lib/browser-utils"

interface SkeletonCardProps {
  index?: number
}

export function SkeletonCard({ index = 0 }: SkeletonCardProps) {
  // 根据索引位置添加不同的动画延迟，创造波浪加载效果
  // 在Safari上禁用延迟，避免闪烁
  const isSafariBrowser = typeof window !== "undefined" ? isSafari() : false
  const animationDelay = isSafariBrowser ? "0s" : `${(index % 10) * 0.05}s`
  const animationClass = isSafariBrowser ? "skeleton-fade-in" : "animate-pulse"

  return (
    <Card className={`overflow-hidden ${animationClass}`} style={{ animationDelay }}>
      <CardHeader className="p-3.5 pb-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 text-sm font-medium">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-4 w-12">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal invisible">
              热榜
            </Badge>
          </Skeleton>
        </div>
        <CardDescription className="text-[10px] line-clamp-1">
          <Skeleton className="h-2.5 w-full" />
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 max-h-[264px]">
        <div className="h-[242px] overflow-y-auto px-3 pb-0 scrollbar-thin">
          <ul className="py-1.5 space-y-1">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <li key={i} className="group relative overflow-hidden rounded-md">
                  <div className="flex items-start gap-1.5 rounded-md p-1">
                    <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <Skeleton className="h-3.5 w-full max-w-[180px]" />
                        <Skeleton className="h-3 w-12 shrink-0" />
                      </div>
                      {i % 2 === 0 && <Skeleton className="mt-1 h-2.5 w-3/4" />}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between p-3.5 pt-2.5 border-t text-[10px]">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </CardFooter>
    </Card>
  )
}
