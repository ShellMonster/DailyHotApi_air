import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
// 添加性能提供者组件
import { PerformanceProvider } from "@/components/performance-provider"

// 优化字体加载
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const metadata = {
  title: "今日热榜 - 实时热点聚合平台",
  description: "聚合微博、知乎、百度、抖音、B站等平台的实时热搜榜单",
  themeColor: "#FF4242",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "今日热榜",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
    generator: 'v0.dev'
}

// 修改RootLayout组件，添加PerformanceProvider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预连接到API域名，减少DNS查询时间 */}
        <link rel="preconnect" href="https://dailyhotpage-lac.vercel.app" />
        <link rel="dns-prefetch" href="https://dailyhotpage-lac.vercel.app" />

        {/* 添加性能相关的meta标签 - 修复 http-equiv 为 httpEquiv */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* 添加Safari检测脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
      (function() {
        try {
          var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isSafari || isIOS) {
            document.documentElement.classList.add('is-safari');
            // 使用更温和的方式预加载，延迟执行避免阻塞渲染
            setTimeout(function() {
              var link = document.createElement('link');
              link.rel = 'preconnect';
              link.href = 'https://dailyhotpage-lac.vercel.app';
              document.head.appendChild(link);
            }, 300);
          }
        } catch(e) {
          // 忽略错误，避免影响页面加载
          console.error('Safari detection error:', e);
        }
      })();
    `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PerformanceProvider>{children}</PerformanceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
