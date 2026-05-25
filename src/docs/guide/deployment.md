# MkNexus 部署架构文档

## 概述

MkNexus 采用本地开发、远程部署的架构。本地负责监听文件变化和构建，远程服务器只负责提供静态文件服务。

## 架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           本地开发机 (/var/server/MkNexus)               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           watch-and-deploy.cjs (监听脚本)                        │   │
│  │                                                                  │   │
│  │  1. chokidar 监听 src/ 目录                                      │   │
│  │  2. 文件变化 → 防抖 500ms                                        │   │
│  │  3. 执行 npm run build                                           │   │
│  │  4. rsync 上传 dist/ 到远程                                      │   │
│  │  5. HTTP POST /__notify 通知刷新                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              │ rsync -avz --delete                      │
│                              ▼                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    远程服务器 (121.43.33.235)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /var/server/MkNexus/dist/                                              │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              mknexus-serve (PM2) - serve.cjs                     │   │
│  │                                                                  │   │
│  │  • HTTP 服务器 (8080)                                            │   │
│  │  • 提供 dist/ 静态文件                                           │   │
│  │  • WebSocket 服务器 (/__ws)                                      │   │
│  │  • 接收 /__notify 通知并广播刷新                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Nginx (443)                                 │   │
│  │                                                                  │   │
│  │  docs.haoaiganfan.top → proxy 127.0.0.1:8080                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│                         🌐 用户浏览器                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 组件说明

### 本地组件

#### watch-and-deploy.cjs
监听文件变化并自动部署的脚本。

**功能：**
- 监听 `src/` 目录变化
- 防抖处理（500ms）
- 执行构建：`npm run build`
- rsync 同步到远程
- 通知远程刷新

**配置：**
```javascript
{
  watchDir: '../src',
  remote: {
    host: 'root@121.43.33.235',
    path: '/var/server/MkNexus/dist',
    port: 8080
  },
  debounceDelay: 500
}
```

**启动：**
```bash
npm run deploy
```

### 远程组件

#### mknexus-serve (PM2)
静态文件服务器，由 PM2 管理。

**功能：**
- 提供 dist/ 目录静态文件
- WebSocket 实时刷新
- 接收构建通知

**状态：**
```bash
pm2 status mknexus-serve
```

#### Nginx
反向代理，提供 HTTPS 访问。

**域名：**
- `https://docs.haoaiganfan.top`

**配置文件：**
- `/etc/nginx/sites-available/mknexus.conf`

## 工作流程

### 开发流程

1. **本地修改代码**
   ```bash
   vim src/docs/guide/getting-started.md
   ```

2. **自动触发构建**
   - watch-and-deploy.cjs 检测到文件变化
   - 等待 500ms（防抖）
   - 执行 `npm run build`
   - 生成 `dist/` 目录

3. **自动部署到远程**
   ```bash
   rsync -avz --delete dist/ root@121.43.33.235:/var/server/MkNexus/dist/
   ```

4. **通知浏览器刷新**
   - POST `/__notify` 到远程
   - WebSocket 广播刷新指令
   - 用户浏览器自动刷新

### 访问流程

1. **用户访问**
   ```
   https://docs.haoaiganfan.top
   ```

2. **Nginx 代理**
   ```
   docs.haoaiganfan.top → 127.0.0.1:8080
   ```

3. **mknexus-serve 响应**
   - 读取 `/var/server/MkNexus/dist/`
   - 返回静态文件

## 关键变化

### 旧架构（已废弃）
```
远程服务器
  ├─ mknexus-serve (静态服务)
  └─ mknexus-watch (监听+构建)  ❌ 已停止
```

### 新架构（当前）
```
本地开发机
  └─ watch-and-deploy.cjs (监听+构建+部署)
           │
           ▼
远程服务器
  └─ mknexus-serve (仅静态服务)
```

## 命令参考

### 本地命令

```bash
# 启动所有服务（编辑器 + 监听部署）
npm run start

# 仅启动监听部署
npm run deploy

# 仅启动编辑器服务
npm run editor

# 手动构建
npm run build

# 手动部署
rsync -avz --delete dist/ root@121.43.33.235:/var/server/MkNexus/dist/
```

### 后台运行（推荐）

使用 screen 让服务在 SSH 断开后继续运行：

```bash
# 新建 screen 会话并启动服务
cd /root/MkNexus
screen -dmS mknexus bash -c "npm run start 2>&1 | tee -a /var/log/mknexus.log"

# 查看所有会话
screen -list

# 重新连接会话（查看日志）
screen -r mknexus
# 按 Ctrl+A 再按 D 分离会话

# 停止服务
screen -X -S mknexus quit
```

### 远程命令

```bash
# 查看 mknexus 状态
pm2 status mknexus-serve

# 查看 nginx 配置
cat /etc/nginx/sites-available/mknexus.conf

# 重启 nginx
systemctl reload nginx

# 查看日志
pm2 logs mknexus-serve
```

## 访问地址

| 环境 | 地址 | 说明 |
|------|------|------|
| 编辑器 (本机) | http://110.40.142.210/editor | Nginx 反向代理 |
| 编辑器 (直连) | http://110.40.142.210:3535 | 端口直连 |
| 本地开发 | http://localhost:3000 | Vite 开发服务器 |
| 远程直连 | http://121.43.33.235:8080 | PM2 服务直连 |
| 生产域名 | https://docs.haoaiganfan.top | Nginx 代理 |

## 故障排查

### 本地监听未工作
```bash
# 检查进程
ps aux | grep watch-and-deploy

# 重启
npm run deploy
```

### 远程未更新
```bash
# 检查 rsync
rsync -avz --delete dist/ root@121.43.33.235:/var/server/MkNexus/dist/

# 检查远程服务
ssh root@121.43.33.235 "pm2 status"
```

### 域名无法访问
```bash
# 检查 nginx
ssh root@121.43.33.235 "nginx -t && systemctl status nginx"

# 检查 DNS
dig docs.haoaiganfan.top
```
