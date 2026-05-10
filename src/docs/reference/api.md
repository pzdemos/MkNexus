# 配置参考

本文档介绍 MkNexus的命令、配置项和技术细节。

## npm 命令

### 开发命令

| 命令 | 作用 | 端口 |
|------|------|------|
| `npm run dev` | 启动 Vite 开发服务器 | 3000 |
| `npm run build` | 执行 TypeScript 编译 + Vite 构建 | - |
| `npm run preview` | 预览构建产物 | 4173 |
| `npm run lint` | 运行 ESLint 代码检查 | - |

### 文档服务命令

| 命令 | 作用 | 端口 | 说明 |
|------|------|------|------|
| `npm run docs:serve` | 启动生产静态文件服务器 | 8080 | 可传参自定义端口 |
| `npm run docs:watch` | 监听文档变化并自动构建 | - | 可传参指定服务器端口 |
| `npm run docs:start` | 同时启动 serve + watch | 8080 | 使用 `concurrently` 并行运行 |

### 自定义端口示例

```bash
# 服务器使用 3000 端口
npm run docs:serve -- 3000

# 监听脚本通知到 3000 端口的服务器
npm run docs:watch -- 3000

# 或者分别启动
npm run docs:serve -- 3000 &
npm run docs:watch -- 3000
```

## 目录配置

### 文档目录

```
src/docs/           # 文档根目录
├── *.md            # 顶层文档
└── */              # 子目录（自动生成导航分组）
    └── *.md        # 分组内的文档
```

### 排序规则

文档和目录按以下规则排序：

1. 目录排在文件前面
2. 同类型按字母顺序排列
3. 支持数字前缀进行人工排序

```
src/docs/
├── 01-guide/               # 排序：1
│   ├── 01-install.md       # 排序：1
│   └── 02-config.md        # 排序：2
├── 02-api/                 # 排序：2
│   └── overview.md
└── changelog.md            # 文件排在目录后
```

前缀中的 `01-`、`02-` 等内容在导航显示时会被自动去除。

### 公共静态资源

```
public/
└── images/         # 文档引用的图片
    ├── diagram.png
    └── screenshot.jpg
```

文档中引用方式：

```markdown
![架构图](/images/diagram.png)
```

## 核心组件

### MarkdownRenderer

渲染 Markdown 内容的核心组件。

```typescript
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface MarkdownRendererProps {
  content: string;    // Markdown 文本内容
  className?: string; // 可选的 CSS 类名
}

// 使用示例
<MarkdownRenderer content={markdownText} />
```

**支持的插件链：**

| 插件 | 作用 |
|------|------|
| `remark-gfm` | GitHub Flavored Markdown（表格、任务列表、删除线等） |
| `rehype-slug` | 为标题元素添加 `id` 属性，用于锚点链接 |
| `rehype-autolink-headings` | 在标题末尾添加锚点链接 |

**自定义渲染组件：**

- **标题** — 自动添加锚点链接，鼠标悬停时显示
- **代码块** — 基于 `react-syntax-highlighter`，支持 100+ 语言
- **表格** — 圆角边框、悬停高亮、横向滚动
- **引用块** — 左侧色条 + 浅色背景 + 斜体
- **任务列表** — 自定义复选框样式

### Sidebar

左侧文档导航树。

```typescript
import { Sidebar } from '@/components/Sidebar';

interface SidebarProps {
  documents: DocNode[];              // 文档树数据
  activePath: string;                // 当前激活的文档路径
  onSelect: (path: string) => void;  // 选择回调
  isOpen: boolean;                   // 移动端是否展开
  onClose: () => void;               // 关闭回调
}
```

**功能：**
- 自动按目录结构生成树形导航
- 目录节点可折叠/展开
- 文件节点显示文档名（自动去除数字前缀和 `.md` 后缀）
- 移动端遮罩层 + 侧滑动画

### SearchBar

文档搜索组件。

```typescript
import { SearchBar } from '@/components/SearchBar';

interface SearchBarProps {
  onSearch: (query: string) => Array<{ name: string; path: string }>;
  onSelect: (path: string) => void;
}
```

**功能：**
- 实时搜索（按标题和内容匹配）
- 快捷键 `Ctrl + K` 聚焦搜索框
- 键盘导航（上下箭头选择，Enter 确认，Esc 关闭）
- 搜索结果最多显示 10 条

### TableOfContents

右侧目录组件。

```typescript
import { TableOfContents } from '@/components/TableOfContents';

interface TableOfContentsProps {
  content: string;  // Markdown 内容
}
```

**功能：**
- 自动提取文档中的二级和三级标题
- 使用 `IntersectionObserver` 跟踪当前阅读位置
- 点击目录项平滑滚动到对应位置

## 自定义 Hooks

### useDocuments

文档发现和加载的核心 Hook。

```typescript
import { useDocuments } from '@/hooks/useDocuments';

const {
  documents,      // DocNode[]   文档树
  loading,        // boolean     加载状态
  error,          // Error|null  错误信息
  hasUpdate,      // boolean     是否有内容更新（轮询检测）
  reload,         // () => void  手动重新加载
  dismissUpdate,  // () => void  关闭更新提示
  applyUpdate,    // () => void  刷新页面应用更新
  getDocument,    // (path) => { name, content } | null
  searchDocuments,// (query) => Array<{ name, path }>
} = useDocuments();
```

**DocNode 类型：**

```typescript
interface DocNode {
  name: string;           // 显示名称
  path: string;           // 文件路径
  isFile: boolean;        // 是否为文件
  content?: string;       // 文件内容（仅文件节点）
  children?: DocNode[];   // 子节点（仅目录节点）
}
```

## 技术架构

### 文档加载流程

```
页面加载
    │
    ▼
useDocuments.loadDocuments()
    │
    ▼
Vite import.meta.glob('/src/docs/**/*.md')
    │
    ▼
动态导入每个 md 文件（?raw 获取文本内容）
    │
    ▼
buildDocTree() — 将扁平文件列表构建为树形结构
    │
    ▼
setDocuments() — 更新 React State，触发 UI 渲染
```

### 自动构建通信流程

```
watch-and-build.cjs                        serve.cjs                                浏览器
        │                                       │                                       │
        │  1. 检测到文件变化                      │                                       │
        │  2. 执行 npm run build                  │                                       │
        │  3. POST /__notify {type:"reload"}      │                                       │
        │ ───────────────────────────────────────▶│                                       │
        │                                       │  4. broadcast()                       │
        │                                       │  5. WebSocket 推送                     │
        │                                       │ ──────────────────────────────────────▶│
        │                                       │                                       │ 6. location.reload()
```

### 文件说明

| 文件 | 说明 |
|------|------|
| `scripts/serve.cjs` | HTTP 静态服务器 + WebSocket 服务器 + 通知 API |
| `scripts/watch-and-build.cjs` | chokidar 文件监听 + 自动构建 + 构建通知 |
| `src/hooks/useDocuments.ts` | 文档发现、加载、搜索、更新检测 |
| `src/components/MarkdownRenderer.tsx` | Markdown 渲染（含语法高亮） |
| `src/components/Sidebar.tsx` | 左侧导航树 |
| `src/components/SearchBar.tsx` | 全文搜索 |
| `src/components/TableOfContents.tsx` | 右侧目录 |
| `src/pages/Home.tsx` | 主页面布局 |
