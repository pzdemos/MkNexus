# 进阶用法

本文档介绍 MkNexus的高级功能、自定义配置和部署指南。

## Markdown 语法支持

阅读器基于 `react-markdown` + `remark-gfm`，完整支持 GitHub Flavored Markdown。

### 基础排版

**粗体文字**：
```markdown
**这是粗体**
```

*斜体文字*：
```markdown
*这是斜体*
```

~~删除线~~：
```markdown
~~这是删除线~~
```

`行内代码`：
```markdown
`const name = "hello"`
```

### 标题层级

```markdown
# 一级标题（文档主标题）
## 二级标题（章节）
### 三级标题（小节）
#### 四级标题
##### 五级标题
###### 六级标题
```

**提示：** 一级标题会被提取为文档标题显示在导航栏中。右侧目录自动提取二级和三级标题。

### 列表

无序列表：
```markdown
- 项目一
- 项目二
  - 子项目 A
  - 子项目 B
- 项目三
```

有序列表：
```markdown
1. 第一步
2. 第二步
3. 第三步
```

### 引用

```markdown
> 这是一段引用文字。
>
> 多行引用可以连续使用。
```

### 链接和图片

```markdown
[链接文字](https://example.com)
![图片描述](/images/diagram.png)
```

**图片建议：** 将图片放在 `public/images/` 目录，文档中通过 `/images/xxx.png` 引用。

### 代码块

使用三个反引号包裹代码，并指定语言以获得语法高亮：

```typescript
// TypeScript 示例
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return `你好，${user.name}！`;
}
```

支持的语言：

| 语言 | 标识符 | 语言 | 标识符 |
|------|--------|------|--------|
| JavaScript | `javascript` / `js` | TypeScript | `typescript` / `ts` |
| Python | `python` / `py` | Java | `java` |
| CSS | `css` | HTML | `html` |
| Bash | `bash` / `sh` | JSON | `json` |
| SQL | `sql` | YAML | `yaml` |

### 表格

```markdown
| 功能 | 基础版 | 专业版 | 企业版 |
|------|:------:|:------:|:------:|
| 文档数量 | 10 | 100 | 无限 |
| 全文搜索 | - | 支持 | 支持 |
| 价格 | 免费 | ¥29/月 | ¥99/月 |
```

### 任务列表

```markdown
#### 开发任务

- [x] 项目架构设计
- [x] 核心渲染引擎
- [x] 导航系统
- [ ] 深色模式
- [ ] 导出 PDF 功能
```

### 分隔线

```markdown
---
```

### 数学公式（扩展）

如需支持数学公式，可以在 `MarkdownRenderer.tsx` 中安装 `remark-math` 和 `rehype-katex` 插件。

## 自定义样式

### 修改主题色

编辑 `src/index.css` 中的 CSS 变量：

```css
@layer base {
  :root {
    --primary: 217 91% 40%;        /* 主色调：蓝色 */
    /* 改为绿色 */
    --primary: 142 71% 35%;        /* 主色调：绿色 */
  }
}
```

### 修改代码块样式

编辑 `src/index.css`：

```css
pre[class*="language-"] {
  background: #1e1e1e !important;  /* 深色代码块 */
  border-radius: 8px;
}
```

### 修改正文字体

编辑 `src/index.css` 的 `body` 样式：

```css
body {
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

### 修改文档最大宽度

编辑 `src/pages/Home.tsx`，找到 `max-w-6xl` 改为其他值：

```jsx
{/* 原文 */}
<div className="max-w-6xl mx-auto flex gap-8 ...">

{/* 改为更宽 */}
<div className="max-w-7xl mx-auto flex gap-8 ...">
```

## 部署指南

### 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### 部署到 GitHub Pages

1. 安装 `gh-pages`：`npm install gh-pages -D`
2. 修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/你的仓库名/',
  // ...
});
```

3. 添加部署脚本：

```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

4. 执行 `npm run deploy`

### 使用 Nginx 部署

```nginx
server {
    listen 80;
    server_name docs.yourdomain.com;
    root /var/www/docs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## 性能优化

### 代码分割

如果主 JS 包过大（当前约 1MB），可以在 `vite.config.ts` 中配置手动分块：

```typescript
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将语法高亮库单独打包
          'syntax-highlighter': ['react-syntax-highlighter'],
          // 将 markdown 处理单独打包
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-slug', 'rehype-autolink-headings'],
        },
      },
    },
  },
});
```

### 图片优化

1. **压缩图片** — 使用 TinyPNG、Squoosh 等工具压缩
2. **使用 WebP** — 现代浏览器有更好的压缩率
3. **控制尺寸** — 文档中的图片建议宽度不超过 1200px
4. **懒加载** — 已默认启用 `loading="lazy"`

## 扩展功能开发

### 添加深色模式

在 `src/index.css` 中添加 dark 变量：

```css
.dark {
  --background: 222 47% 7%;
  --foreground: 210 20% 95%;
  /* ... */
}
```

添加主题切换按钮组件，切换 `<html>` 标签的 `dark` class。

### 添加导出 PDF 功能

可以使用浏览器原生打印功能：

1. 添加打印样式 `src/print.css`：

```css
@media print {
  .sidebar, .search-bar, .toc { display: none; }
  .content { max-width: 100%; margin: 0; }
}
```

2. 添加打印按钮：

```typescript
const handlePrint = () => window.print();
```

### 添加文档编辑按钮

在每个文档页面添加"编辑"按钮，链接到文档的编辑地址：

```typescript
const editUrl = `https://github.com/你的仓库/edit/main/src/docs/${docPath}`;
```
