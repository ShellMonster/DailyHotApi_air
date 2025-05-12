import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
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

        {/* 添加性能相关的meta标签 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* 添加Safari渲染修复脚本 - 更激进的方案 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // 检查是否已经运行过此脚本
  if (window.__SAFARI_FIXED__) return;
  window.__SAFARI_FIXED__ = true;
  
  try {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isSafari || isIOS) {
      // 1. 立即添加Safari类
      document.documentElement.classList.add('is-safari');
      
      // 2. 添加内联样式以防止闪烁
      var style = document.createElement('style');
      style.textContent = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(style);
      
      // 3. 在DOM内容加载完成后移除样式
      document.addEventListener('DOMContentLoaded', function() {
        // 使用双重requestAnimationFrame确保在下一帧渲染前移除样式
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            // 移除禁用动画的样式
            document.head.removeChild(style);
            
            // 添加已加载类
            document.documentElement.classList.add('safari-loaded');
            
            console.log('Safari render fix applied');
          });
        });
      });
      
      // 4. 预连接到API域名
      var link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = 'https://dailyhotpage-lac.vercel.app';
      document.head.appendChild(link);
    }
  } catch(e) {
    console.error('Safari detection error:', e);
  }
})();
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
