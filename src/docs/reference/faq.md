# 常见问题解答

## 基础问题

### Q: 如何添加新的文档？

**A:** 将 Markdown 文件（`.md`）放入 `src/docs/` 目录即可。支持子目录组织。

```bash
# 添加单个文档
echo "# 我的文档" > src/docs/intro.md

# 添加带目录结构的文档
mkdir -p src/docs/项目文档
cat > src/docs/项目文档/需求分析.md << 'EOF'
# 需求分析

本文档描述项目需求...
EOF
```

根据你使用的模式，新文档的可见方式不同：

| 模式 | 新增文档如何可见 |
|------|----------------|
| `npm run dev` | **手动刷新**浏览器页面 |
| `npm run docs:start` | 保存后**自动构建 + 自动刷新** |
| `npm run build` | 重新构建后部署 |

### Q: 支持哪些 Markdown 语法？

**A:** 完整支持 [GitHub Flavored Markdown](https://github.github.com/gfm/)，包括：

- 基础排版：标题、段落、粗体、斜体、删除线、行内代码
- 列表：有序列表、无序列表、嵌套列表
- 代码块：语法高亮（100+ 语言）
- 表格：支持对齐标记
- 任务列表：`- [x]` / `- [ ]`
- 引用块、分隔线、链接、图片
- 自动链接（URL 自动转为可点击链接）

### Q: 文档名显示的数字前缀是什么？

**A:** 数字前缀用于控制导航排序顺序。例如 `01-安装.md` 会排在 `02-配置.md` 前面。显示时前缀会被自动去除，只显示 `安装`。

```
src/docs/
├── 01-guide/           # 导航显示为 "guide"
│   ├── 01-start.md     # 导航显示为 "start"
│   └── 02-advanced.md  # 导航显示为 "advanced"
└── 02-api/
    └── overview.md
```

## 使用问题

### Q: `npm run docs:start` 和 `npm run dev` 有什么区别？

**A:** 两者适用场景不同：

| 对比项 | `npm run dev` | `npm run docs:start` |
|--------|---------------|---------------------|
| 服务器 | Vite 开发服务器 | 自定义静态文件服务器 |
| 构建速度 | 增量编译，极快 | 全量构建，约 12 秒 |
| 新增文档 | 需手动刷新 | 自动构建 + 自动刷新 |
| 适用场景 | 本地写作 | 对外提供文档服务 |
| 浏览器刷新 | 修改已有文档即时刷新 | 全部自动刷新 |

**建议：** 日常写作使用 `npm run dev`，对外服务使用 `npm run docs:start`。

### Q: 修改已有文档后，浏览器没有自动刷新？

**A:** 请确认你使用的模式：

1. **`npm run dev` 模式下**
   - 修改已有文档 &rarr; 应该即时刷新
   - 如果没有刷新，检查浏览器控制台是否有报错
   - 确保修改的是 `src/docs/` 下的 `.md` 文件

2. **`npm run docs:start` 模式下**
   - 检查监听脚本是否正常运行（终端是否有输出）
   - 检查服务器是否正常运行
   - 文件保存后等待约 12 秒（构建时间）

3. **通用排查**
   - 检查文件名是否为 `.md` 扩展名
   - 检查文件是否在 `src/docs/` 目录下
   - 查看终端是否有报错信息

### Q: 如何修改文档的排序？

**A:** 三种方式：

1. **数字前缀**（推荐）
   ```
   01-intro.md
   02-guide.md
   03-reference.md
   ```

2. **字母顺序**
   ```
   api.md        # 排在最前
   guide.md
   intro.md
   ```

3. **目录分组**
   ```
   src/docs/
   ├── 01-基础文档/
   ├── 02-进阶文档/
   └── 03-参考资料/
   ```

### Q: 搜索功能支持哪些内容？

**A:** 搜索会匹配以下内容：

- 文档文件名
- 一级标题（`# 标题`）
- 文档全文内容

快捷键 `Ctrl + K` 快速聚焦搜索框，支持键盘上下选择、Enter 打开、Esc 关闭。

## 部署问题

### Q: 如何部署到自己的服务器？

**A:** 最简单的部署方式：

```bash
# 1. 构建
npm run build

# 2. 将 dist/ 目录上传到服务器
# 3. 使用任意 Web 服务器提供静态文件服务
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name docs.example.com;
    root /var/www/docs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Q: 支持部署到哪些平台？

**A:** 由于是纯静态网站，支持所有静态托管平台：

| 平台 | 难度 | 说明 |
|------|------|------|
| Vercel | 简单 | 导入 GitHub 仓库即可 |
| Netlify | 简单 | 拖拽上传 dist/ 目录 |
| GitHub Pages | 中等 | 需配置 base 路径 |
| Cloudflare Pages | 简单 | 连接 Git 仓库自动部署 |
| Nginx | 中等 | 自行配置服务器 |
| 阿里云 OSS | 简单 | 上传静态文件 |

### Q: 如何配置自定义域名？

**A:** 纯前端应用无需特殊配置，在托管平台中绑定自定义域名即可。如果是自托管，配置 Nginx/Apache 的 `server_name`。

## 构建问题

### Q: 构建报错怎么办？

**A:** 常见错误及解决方案：

**TypeScript 类型错误**
```bash
# 检查是否缺少类型定义
npm install @types/xxx --save-dev
```

**缺少模块**
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

**内存不足**
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Q: 构建产物太大怎么办？

**A:** 当前主包约 1MB（含语法高亮库的所有语言定义），可通过代码分割优化：

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-slug', 'rehype-autolink-headings'],
          'highlight': ['react-syntax-highlighter'],
          'ui': ['lucide-react'],
        },
      },
    },
  },
});
```

## 自定义问题

### Q: 可以修改导航栏标题吗？

**A:** 编辑 `src/components/Sidebar.tsx`，找到：

```tsx
<h1 className="text-sm font-bold">MkNexus</h1>
<p className="text-xs text-muted-foreground">Markdown 实时解析</p>
```

### Q: 可以修改主题色吗？

**A:** 编辑 `src/index.css` 中的 CSS 变量：

```css
:root {
  --primary: 217 91% 40%;  /* 蓝色（默认） */
  /* --primary: 142 71% 35%; */  /* 绿色 */
  /* --primary: 0 72% 51%; */    /* 红色 */
}
```

常用色值参考：

| 颜色 | HSL 值 |
|------|--------|
| 蓝色 | `217 91% 40%` |
| 绿色 | `142 71% 35%` |
| 红色 | `0 72% 51%` |
| 紫色 | `262 83% 58%` |
| 橙色 | `24 95% 53%` |

### Q: 可以添加深色模式吗？

**A:** 可以。需要：

1. 在 `src/index.css` 中添加深色变量：

```css
.dark {
  --background: 222 47% 7%;
  --foreground: 210 20% 95%;
  /* ... */
}
```

2. 添加主题切换按钮组件
3. 使用 `localStorage` 保存用户偏好

### Q: 如何添加文档编辑按钮？

**A:** 在 `src/pages/Home.tsx` 的文档标题区域添加编辑链接：

```tsx
<a
  href={`https://github.com/你的用户名/你的仓库/edit/main/src/docs/${activePath}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-muted-foreground hover:text-primary"
>
  编辑此页
</a>
```

## 其他问题

### Q: 文档可以导出为 PDF 吗？

**A:** 可以使用浏览器打印功能导出：

1. 打开要导出的文档
2. 按 `Ctrl + P`（Windows）或 `Cmd + P`（Mac）
3. 目标选择「另存为 PDF」
4. 调整页面设置后保存

如需优化打印样式，可在 `src/index.css` 中添加：

```css
@media print {
  .sidebar, header, .toc { display: none !important; }
}
```

### Q: 多人协作时如何避免冲突？

**A:** 由于文档是纯文本的 Markdown 文件，建议使用 Git 进行版本控制：

```bash
# 初始化 Git 仓库
git init

# 添加文档
git add src/docs/
git commit -m "更新文档"

# 查看历史
git log src/docs/intro.md
```

### Q: 遇到其他问题怎么办？

**A:** 排查步骤：

1. 检查浏览器控制台是否有报错信息
2. 检查终端输出是否有构建错误
3. 确认文件路径和命名是否正确
4. 尝试重新安装依赖：`rm -rf node_modules && npm install`
5. 参考本文档其他章节

---

*仍有疑问？建议查看[配置参考](./api.md)了解技术细节，或阅读[进阶用法](../guide/advanced.md)了解自定义开发。*
