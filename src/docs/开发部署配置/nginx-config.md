# Nginx 代理配置总览

## 1. www.haoaiganfan.top (主站)
- **类型**: 混合（静态文件 + 代理）
- **静态根目录**: /var/www/wwwroot
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | / | 直接读取静态文件 | index.html |
  | /api/ | 3000 | linux-file-manager API |
  | /api/nginx/ | 3000 | Nginx 管理接口 |
  | /secure | 3000 | 安全路径 |
  | /terminal | 3000 (WS) | WebSocket 终端 |
  | /tmux | 3000 (WS) | tmux 终端 |
  | /ms/ | 7878 (WS) | Chat 服务 |
  | /uploads/ | 5200 | common-design 上传 |
  | /design/ | 5200 | common-design 服务 |
  | /openclaw | 18789 | Gateway |

## 2. admin.haoaiganfan.top
- **类型**: 混合（静态文件 + 代理）
- **静态根目录**: /var/www/flux-front
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | / | 直接读取静态文件 | flux 前端 SPA |
  | /flux | 9000 | flux 后端 API |

## 3. adminv1.haoaiganfan.top (新增)
- **类型**: 纯反向代理
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | /（全部） | 3000 | linux-file-manager |

## 4. cron.haoaiganfan.top
- **类型**: 混合（静态文件 + 代理）
- **静态根目录**: /var/server/cronmaster-frontend/dist
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | / | 直接读取静态文件 | cronmaster 前端 |
  | /api/ | 3001 | cronmaster-backend API |
  | /health | 3001 | 健康检查 |

## 5. mongo.haoaiganfan.top
- **类型**: 纯反向代理
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | /、/api/ | 5000 | mongox |

## 6. docs.haoaiganfan.top
- **类型**: 纯反向代理
- **代理规则**:
  | 路径 | 目标 | 说明 |
  |------|------|------|
  | / | 8080 | MkNexus |
  | /__ws | 8080 (WS) | WebSocket |
  | /__notify | 8080 (WS) | 通知 |

## 7. test.haoaiganfan.top
- **类型**: 直接响应
- **返回**: 200 OK（Cloudflare SSL 测试）

## PM2 后端项目对应端口

| 端口 | PM2 名称 | 项目路径 |
|------|---------|---------|
| 3000 | linux-file-manager | /var/server/linux-file-manager |
| 3001 | cronmaster-backend | /var/server/cronmaster-backend |
| 5000 | mongox | /var/server/mongox |
| 5200 | common-design | /var/server/common-design |
| 7878 | chat | /var/server/chat |
| 8080 | mknexus-serve | /var/server/MkNexus |
| 9000 | flux | /var/server/flux |
