import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h2 className="text-2xl font-bold mb-4">页面未找到</h2>
        <p className="text-muted-foreground mb-6">抱歉，您访问的页面不存在或已被移除。</p>
        <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md inline-block">
          返回首页
        </Link>
      </div>
    </div>
  )
}
