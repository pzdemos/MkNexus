# MkNexus

现代化 Markdown 文档站点系统，支持实时编辑、自动构建与远程部署。

## ✨ 特性

- 📝 **Web 可视化编辑器** - 内置独立的 Markdown 编辑工作区
- 🚀 **自动构建部署** - 文件变化监听 → 自动构建 → rsync 同步到远程
- 🎨 **精美 UI 设计** - 基于 shadcn/ui 的现代界面，支持暗色模式
- 📱 **响应式布局** - 完美适配桌面端和移动端
- 🔍 **全文搜索** - 支持跨文档内容搜索
- 📑 **目录导航** - 自动生成文档目录
- 🌳 **文件树管理** - 可视化文件/目录操作（新建、重命名、删除、移动）
- 🔌 **外部 API** - 支持通过 HTTP API 上传文档

## 📁 项目结构

```
MkNexus/
├── src/                          # 源代码
│   ├── docs/                     # Markdown 文档内容
│   │   ├── guide/                # 指南文档
│   │   ├── reference/            # 参考文档
│   │   └── *.md                  # 文档文件
│   ├── components/               # React 组件
│   │   ├── ui/                   # shadcn/ui 组件库
│   │   ├── Sidebar.tsx           # 侧边栏导航
│   │   ├── MarkdownRenderer.tsx  # Markdown 渲染器
│   │   ├── TableOfContents.tsx   # 目录组件
│   │   └── SearchBar.tsx         # 搜索栏
│   ├── hooks/                    # React Hooks
│   ├── lib/                      # 工具函数
│   ├── pages/                    # 页面组件
│   │   ├── Layout.tsx            # 主布局
│   │   ├── HomePage.tsx          # 首页
│   │   └── DocView.tsx           # 文档视图
│   ├── App.tsx                   # 应用入口
│   └── main.tsx                  # React 挂载点
├── editor-ui/                    # 独立编辑器前端
│   ├── index.html                # 编辑器 HTML
│   ├── app.js                    # 编辑器逻辑
│   └── style.css                 # 编辑器样式
├── scripts/                      # 服务脚本
│   ├── editor-server.cjs         # 编辑器 API 服务 (端口 3535)
│   ├── watch-and-deploy.cjs      # 监听+自动部署
│   └── serve.cjs                 # 静态文件服务
├── public/                       # 静态资源
├── .editor-temp/                 # 编辑器临时目录
├── dist/                         # 构建输出目录
└── package.json                  # 项目配置
```

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **React Router v7** - 路由管理
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **React Markdown** - Markdown 渲染
- **Highlight.js** - 代码高亮

### 编辑器
- **Express.js** - API 服务
- **Multer** - 文件上传处理
- **Marked.js** - Markdown 解析
- **原生 JavaScript** - 无框架依赖

### 部署工具
- **Chokidar** - 文件监听
- **rsync** - 远程同步
- **PM2** - 进程管理

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn
- rsync (用于远程部署)

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd MkNexus

# 安装依赖
npm install
```

### 本地开发

```bash
# 启动开发服务器 (端口 3000)
npm run dev

# 启动编辑器 (端口 3535)
npm run editor
```

访问：
- 主站点：http://localhost:3000
- 编辑器：http://localhost:3535

## 📝 编辑器使用

### 启动编辑器

```bash
npm run editor
```

### 功能说明

#### 文件操作
- **新建文件** - 点击 `+` 按钮，输入文件名（必须以 .md 结尾）
- **新建目录** - 点击 `📁` 按钮
- **重命名** - 悬停文件，点击 `✎` 图标
- **删除** - 悬停文件，点击 `✕` 图标
- **移动** - 拖拽文件到目标目录

#### 编辑与保存
- 点击文件打开编辑器
- 修改后点击「保存」按钮（或 Ctrl+S）
- 保存时会自动检测改动，无改动时跳过

#### 部署流程
1. 编辑文件保存到 `.editor-temp/` 临时目录
2. 左侧显示待部署文件数量
3. 点击「部署」按钮执行：
   - 复制临时文件到 `src/docs/`
   - 触发构建（如监听服务运行）
   - 清空临时目录

#### 查看改动详情
点击「X 个文件待部署」区域展开查看：
- `+` 新建文件（绿色）
- `~` 修改文件（黄色）
- `×` 删除文件（红色）
- `→` 移动文件（灰色）

### 外部 API

编辑器提供 HTTP API 供外部工具调用：

#### JSON 方式上传

```bash
curl -X POST http://your-domain:3535/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "path": "guide/example.md",
    "content": "# 新文档\n\n内容..."
  }'
```

#### 文件方式上传

```bash
curl -X POST http://your-domain:3535/api/upload/file \
  -F "file=@/path/to/document.md" \
  -F "path=guide"
```

## 🔄 自动部署

### 工作原理

```
文件变化 → 防抖(500ms) → 触发构建 → rsync 同步 → 通知远程刷新
```

### 配置

编辑 `scripts/watch-and-deploy.cjs`：

```javascript
const CONFIG = {
  watchDir: './src',           // 监听目录
  remote: {
    host: 'root@121.43.33.235', // 远程服务器
    path: '/var/server/MkNexus/dist', // 远程路径
    port: 8080,                 // WebSocket 通知端口
  },
  debounceDelay: 500,           // 防抖延迟
};
```

### 启动监听

```bash
npm run deploy
```

### rsync 参数说明

```bash
rsync -avz --delete dist/ root@remote:/path/
```

- `-a` - 归档模式，保留权限
- `-v` - 详细输出
- `-z` - 压缩传输
- `--delete` - 删除远程不存在文件

## 🌐 远程部署

### 服务器配置

#### 1. 安装依赖

```bash
# 安装 rsync
apt install rsync

# 安装 PM2
npm install -g pm2
```

#### 2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name docs.haoaiganfan.top;

    # 主站点
    location / {
        root /var/server/MkNexus/dist;
        try_files $uri $uri/ /index.html;
    }

    # 编辑器代理
    location /editor/ {
        proxy_pass http://localhost:3535/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3. 启动服务

```bash
# 启动静态文件服务
pm2 start scripts/serve.cjs --name mknexus-serve

# 启动编辑器服务
pm2 start scripts/editor-server.cjs --name mknexus-editor

# 保存配置
pm2 save
```

### 本地开发流程

1. 本地运行 `npm run deploy` 启动监听
2. 编辑器修改文件并部署
3. 自动构建并 rsync 到远程
4. 远程站点自动更新

## 📦 构建与部署

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 🔧 配置说明

### Vite 配置

- 开发服务器端口：3000
- 路径别名：`@` → `./src`

### Tailwind 配置

- 支持暗色模式
- 使用 CSS 变量主题系统
- 集成 shadcn/ui

### 编辑器配置

编辑器端口、文档路径等配置在 `scripts/editor-server.cjs` 中：

```javascript
const PORT = 3535;
const DOCS_DIR = path.resolve(__dirname, '../src/docs');
const TEMP_DIR = path.resolve(__dirname, '../.editor-temp');
```

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
