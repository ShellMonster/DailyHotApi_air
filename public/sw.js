const CACHE_NAME = "hot-search-cache-v2"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
]

// 安装Service Worker并缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting()),
  )
})

// 激活新的Service Worker并清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME
            })
            .map((name) => {
              return caches.delete(name)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// 网络优先策略，失败时使用缓存
self.addEventListener("fetch", (event) => {
  // 跳过非GET请求和API请求
  if (event.request.method !== "GET" || event.request.url.includes("dailyhotpage-lac.vercel.app")) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 克隆响应以便我们可以同时使用它和缓存它
        const responseClone = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })

        return response
      })
      .catch(() => {
        // 网络请求失败时，尝试从缓存中获取
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // 如果缓存中也没有，尝试返回离线页面
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }

          return new Response("Network error", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          })
        })
      }),
  )
})

// 后台同步API数据
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-hot-search") {
    event.waitUntil(syncHotSearch())
  }
})

// 接收推送通知
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/favicon.png",
    data: {
      url: data.url,
    },
  }

  event.waitUntil(self.registration.showNotification("今日热榜", options))
})

// 点击通知时打开相应页面
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})

// 同步热搜数据的函数
async function syncHotSearch() {
  try {
    // 这里可以实现后台同步逻辑
    console.log("Background sync executed")
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}
