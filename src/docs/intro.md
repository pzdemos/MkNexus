# MkNexus

一个优雅的 Markdown 实时解析阅读器，帮助你轻松管理和阅读项目中的文档。

## 核心特性

| 特性 | 说明 |
|------|------|
| **自动文档发现** | 将 `.md` 文件放入指定目录即可自动加载，支持子目录组织 |
| **完整 Markdown 支持** | 支持 GitHub Flavored Markdown 全部语法 |
| **实时热刷新** | 文件修改后自动构建，浏览器即时刷新 |
| **路由系统** | 每篇文档有独立 URL，刷新不丢失阅读进度 |
| **文档首页** | 总览页展示所有文档卡片，快速导航 |
| **树形导航** | 左侧边栏按目录结构生成可折叠导航 |
| **可点击面包屑** | 面包屑每段可点击，快速跳转到上级目录 |
| **全文搜索** | 支持标题和内容搜索（`Ctrl + K`） |
| **动态目录** | 右侧自动提取文档标题，锚点跳转 |
| **响应式布局** | 桌面三栏 / 移动单栏自适应 |

## 技术栈

- **React 19** + TypeScript + Vite
- **HashRouter** 路由（静态部署兼容）
- **Tailwind CSS** + shadcn/ui
- **react-markdown** + remark-gfm + rehype-slug
- **react-syntax-highlighter** 代码高亮
- **chokidar** 文件监听 + **WebSocket** 实时通信
- **sonner** Toast 通知

## 项目结构

```
project/
├── src/
│   ├── docs/                  # 文档目录
│   ├── components/            # React 组件
│   ├── hooks/                 # 自定义 Hooks
│   ├── pages/                 # 页面
│   │   ├── Layout.tsx         # 共享布局
│   │   ├── HomePage.tsx       # 文档总览首页
│   │   └── DocView.tsx        # 文档阅读页
│   └── scripts/
│       ├── serve.cjs          # 静态文件服务器
│       └── watch-and-build.cjs # 文件监听与自动构建
├── dist/                      # 构建输出目录
└── package.json
```

## 路由设计

MkNexus 采用 HashRouter，所有路由以 `/#/` 开头，兼容任意静态托管平台：

| 路径 | 说明 |
|------|------|
| `/#/` | 文档总览首页，展示所有文档卡片 |
| `/#/doc/:path` | 文档阅读页，`:path` 为文档相对路径 |

**示例：**

```
/#/                           → 文档总览首页
/#/doc/intro.md               → 阅读 intro.md
/#/doc/guide/getting-started.md → 阅读 guide/getting-started.md
```

**特性：**

- 刷新页面不丢失当前文档位置
- 可直接分享文档链接给他人
- 浏览器前进/后退正常工作

## 三种使用模式

### 模式一：开发模式（写作最流畅）

```bash
npm run dev
```

### 模式二：自动构建模式（推荐生产使用）

```bash
npm run docs:start
```

### 模式三：纯静态部署

```bash
npm run build
```

---

*更多详细说明请参考其他文档。*
