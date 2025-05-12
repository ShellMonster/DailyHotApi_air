# 今日热榜 - 实时热点聚合平台

<p align="center">
  <img src="https://github.com/user-attachments/assets/5836b587-d687-4941-867a-297c457635a0" alt="今日热榜 Logo" width="100" height="100">
</p>

<img width="1473" alt="image" src="https://github.com/user-attachments/assets/450701d8-c786-4cf2-a79a-27ed31c79cd0" />
</br></br>

<p align="center">
  <strong>一站式热搜聚合平台，实时掌握全网热点</strong>
</p>

<p align="center">
  <a href="#功能特点">功能特点</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#安装与使用">安装与使用</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#贡献指南">贡献指南</a> •
  <a href="#许可证">许可证</a>
</p>

## 项目简介

今日热榜是一个聚合各大平台热搜的实时热点聚合平台，支持微博、知乎、百度、抖音、B站等多个平台的热搜榜单。项目采用响应式设计，同时支持PWA，可安装到桌面，离线访问，提供类原生应用体验。

本项目完全由V0基于AI进行开发，项目作者是一名产品经理，并不懂代码。如有任何问题或建议，欢迎通过GitHub Issues提出，我们会尽快处理。

**在线示例：** [news.geekaso.com](https://news.geekaso.com)

## 致谢

本项目基于 [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) 项目提供的API构建而成，但并非直接使用原API，而是使用该API在Vercel上部署后的版本来构建此Web前端。原项目也有对应的Web端实现，访问地址为：[hot.imsyy.top](https://hot.imsyy.top/#/)。

如果您喜欢本项目，请优先考虑给原项目 [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) 点个Star以表示支持，感谢！

## 功能特点

- **多平台聚合**：聚合微博、知乎、百度、抖音、B站等多个平台的热搜榜单
- **实时更新**：每5分钟自动更新数据，确保热点信息的时效性
- **关键词分析**：分析各平台热搜关键词，发现热点趋势
- **搜索功能**：支持跨平台搜索热搜内容
- **响应式设计**：完美适配桌面和移动设备
- **PWA支持**：可安装到桌面，支持离线访问
- **暗色模式**：支持亮色/暗色主题切换
- **性能优化**：采用多项性能优化措施，确保流畅体验

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI组件**：Tailwind CSS + shadcn/ui
- **状态管理**：React Hooks
- **动画效果**：Framer Motion
- **图标库**：Lucide React
- **日期处理**：date-fns
- **主题切换**：next-themes
- **PWA支持**：Service Worker + Web Manifest

## 安装与使用

### 开发环境

1. 克隆仓库
```bash
git clone https://github.com/ShellMonster/DailyHotApi_air.git
cd DailyHotApi_air
```

2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. 在浏览器中访问 `http://localhost:3000`

### 生产环境

1. 构建项目
```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

2. 启动生产服务器
```bash
npm run start
# 或
yarn start
# 或
pnpm start
```

### 部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FShellMonster%2FDailyHotApi_air)

## 项目结构

```
DailyHotApi_air/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局组件
│   ├── page.tsx            # 首页组件
│   ├── globals.css         # 全局样式
│   └── not-found.tsx       # 404页面
├── components/             # React组件
│   ├── platform-card.tsx   # 平台卡片组件
│   ├── platform-grid.tsx   # 平台网格组件
│   ├── search-dialog.tsx   # 搜索对话框组件
│   ├── keyword-analysis.tsx # 关键词分析组件
│   ├── mobile-nav.tsx      # 移动端导航组件
│   ├── theme-toggle.tsx    # 主题切换组件
│   ├── error-boundary.tsx  # 错误边界组件
│   └── ui/                 # UI组件库
├── config/                 # 配置文件
│   └── platforms.tsx       # 平台配置
├── hooks/                  # 自定义Hooks
│   ├── use-mobile.tsx      # 移动设备检测Hook
│   └── use-toast.ts        # Toast通知Hook
├── lib/                    # 工具函数
│   ├── utils.ts            # 通用工具函数
│   └── performance-utils.ts # 性能优化工具
├── public/                 # 静态资源
│   ├── favicon.ico         # 网站图标
│   ├── manifest.json       # PWA配置
│   ├── sw.js               # Service Worker
│   └── icon-*.png          # 各种尺寸的图标
├── types/                  # TypeScript类型定义
│   └── index.ts            # 类型定义文件
├── next.config.mjs         # Next.js配置
├── tailwind.config.ts      # Tailwind CSS配置
├── package.json            # 项目依赖
└── README.md               # 项目说明
```

## 数据来源

本项目数据来源于 [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) 提供的API，感谢该服务提供的数据支持。

## 贡献指南

欢迎贡献代码，提出问题或建议！请按照以下步骤参与项目：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 未来计划

- [ ] 添加更多平台支持
- [ ] 实现热点趋势图表分析
- [ ] 添加用户自定义布局
- [ ] 支持热点话题订阅
- [ ] 添加热点历史记录功能
- [ ] 优化移动端体验
- [ ] 添加国际化支持

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有任何问题或建议，请通过以下方式联系我：

- GitHub：[ShellMonster](https://github.com/ShellMonster)
- 提交Issues：[项目Issues](https://github.com/ShellMonster/DailyHotApi_air/issues)

---

<p align="center">
  Made with ❤️ by ShellMonster
</p>
