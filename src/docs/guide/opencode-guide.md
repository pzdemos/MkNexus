# OpenCode 完整操作指南

## 一、简介

OpenCode 是一个开源 AI 编程助手，拥有 160K+ GitHub Stars，支持 75+ LLM 提供商。

**核心特性：**
- 开源免费
- 多模型支持（Claude、GPT、Gemini、本地模型等）
- 多端可用（终端 CLI、桌面应用、IDE 扩展）
- 隐私优先（不存储代码或上下文数据）
- 多会话并行
- LSP 智能感知

---

## 二、安装

### 方式1：官方脚本（推荐）
```bash
curl -fsSL https://opencode.ai/install | bash
```

### 方式2：包管理器
```bash
# npm
npm install -g opencode-ai

# Homebrew (macOS/Linux)
brew install anomalyco/tap/opencode

# Arch Linux
sudo pacman -S opencode

# Docker
docker run -it --rm ghcr.io/anomalyco/opencode
```

---

## 三、配置

### 登录配置 API Key
```bash
opencode auth login
```

或指定提供商：
```bash
opencode auth login -p anthropic
```

### 查看已配置的提供商
```bash
opencode auth list
```

### 登出
```bash
opencode auth logout
```

### 查看可用模型
```bash
# 所有模型
opencode models

# 指定提供商
opencode models anthropic

# 刷新缓存
opencode models --refresh
```

---

## 四、基础用法

### 1. 交互模式（TUI）
```bash
# 启动交互界面
opencode

# 继续上一个会话
opencode -c

# 指定会话继续
opencode -s <session-id>

# 启动时带初始提示
opencode --prompt "解释这段代码"
```

**TUI 常用命令：**
| 命令 | 说明 |
|------|------|
| `/init` | 初始化项目，生成 AGENTS.md |
| `/connect` | 配置提供商连接 |
| `/undo` | 撤销上一次更改 |
| `/redo` | 重做更改 |
| `/share` | 分享当前会话 |
| `<Tab>` | 切换 Plan/Build 模式 |
| `@` | 模糊搜索文件 |

---

### 2. 非交互模式（CLI）

#### 基础命令
```bash
opencode run "解释 JavaScript 闭包"
```

#### 常用参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `--model` | `-m` | 指定模型 `provider/model` |
| `--agent` | | 使用指定 agent |
| `--file` | `-f` | 附加文件到消息 |
| `--continue` | `-c` | 继续上一个会话 |
| `--session` | `-s` | 指定会话 ID 继续 |
| `--thinking` | | 显示思考过程 |
| `--share` | | 自动分享会话 |
| `--format` | | 输出格式：`default` 或 `json` |
| `--dir` | | 指定运行目录 |
| `--attach` | | 连接到运行中的服务器 |

#### 示例
```bash
# 指定模型
opencode run -m opencode/gemini-2.5-pro "解释这段代码"

# 附加文件
opencode run -f src/index.ts "解释这个文件的作用"

# 显示思考过程
opencode run --thinking "重构这个函数"
```

---

## 五、上下文保持

### 会话机制
OpenCode 将会话历史存储在本地数据库，每个会话有唯一 ID。

### 继续上一个会话
```bash
# 第一次
opencode run "解释闭包"

# 继续（有上下文）
opencode run -c "再举个例子"

# 继续追问
opencode run -c "有什么缺点？"
```

### 指定会话继续
```bash
# 查看会话列表
opencode session list -n 10

# 使用指定会话
opencode run -s <session-id> "继续讨论..."
```

---

## 六、会话管理

```bash
# 列出所有会话
opencode session list

# 列出最近 N 个
opencode session list -n 10

# JSON 格式输出
opencode session list --format json

# 删除会话
opencode session delete <session-id>
```

---

## 七、Agents（代理）

### 查看可用 agents
```bash
opencode agent list
```

### 创建 agent
```bash
# 交互式创建
opencode agent create

# 非交互式创建
opencode agent create \
  --path .opencode/agent/my-agent.md \
  --description "React 组件专家" \
  --mode primary \
  --permissions "read,edit,bash" \
  -m anthropic/claude-sonnet-4-20250514
```

### 权限列表
- `bash` - 执行终端命令
- `read` - 读取文件
- `edit` - 编辑文件
- `glob` - 文件搜索
- `grep` - 内容搜索
- `webfetch` - 网页获取
- `task` - 启动子任务
- `todowrite` - 任务列表
- `websearch` - 网页搜索
- `lsp` - LSP 服务
- `skill` - 技能加载

---

## 八、高级用法

### Server 模式

```bash
# 启动 headless 服务器
opencode serve

# 带端口和主机名
opencode serve --port 4096 --hostname 0.0.0.0

# 带密码保护
OPENCODE_SERVER_PASSWORD=yourpassword opencode serve
```

连接到运行中的服务器：
```bash
opencode run --attach http://localhost:4096 "解释闭包"
```

### Web 界面
```bash
opencode web
```

### PR 模式
```bash
# 检出 GitHub PR 并运行
opencode pr <pr-number>
```

### 数据库工具
```bash
# 查询数据库
opencode db "SELECT * FROM sessions LIMIT 5"

# 输出 JSON
opencode db "SELECT * FROM sessions" --format json

# 查看数据库路径
opencode db path
```

---

## 九、统计与数据

### 使用统计
```bash
# 查看 token 使用和成本
opencode stats

# 最近 N 天
opencode stats --days 7

# 按项目筛选
opencode stats --project ""  # 当前项目

# 显示模型使用详情
opencode stats --models 5
```

### 导出/导入
```bash
# 导出会话
opencode export <session-id>

# 导出并脱敏
opencode export <session-id> --sanitize

# 从文件导入
opencode import session.json

# 从分享链接导入
opencode import https://opncd.ai/s/abc123
```

---

## 十、插件与配置

### 安装插件
```bash
opencode plug <module>

# 全局安装
opencode plug -g <module>
```

### MCP 服务器管理
```bash
# 添加 MCP 服务器
opencode mcp add

# 列出已配置的 MCP 服务器
opencode mcp list

# MCP OAuth 认证
opencode mcp auth [name]

# 登出 MCP
opencode mcp logout [name]
```

---

## 十一、环境变量

| 变量 | 说明 |
|------|------|
| `OPENCODE_CONFIG` | 配置文件路径 |
| `OPENCODE_CONFIG_DIR` | 配置目录 |
| `OPENCODE_SERVER_PASSWORD` | 服务器密码 |
| `OPENCODE_SERVER_USERNAME` | 服务器用户名（默认 opencode） |
| `OPENCODE_AUTO_SHARE` | 自动分享会话 |
| `OPENCODE_DISABLE_AUTOUPDATE` | 禁用自动更新检查 |
| `OPENCODE_EXPERIMENTAL` | 启用所有实验特性 |

---

## 十二、升级与卸载

### 升级
```bash
# 升级到最新版
opencode upgrade

# 升级到指定版本
opencode upgrade v0.1.48
```

### 卸载
```bash
# 完全卸载
opencode uninstall

# 保留配置
opencode uninstall -c

# 保留数据
opencode uninstall -d

# 预览卸载内容
opencode uninstall --dry-run
```

---

## 十三、帮助与调试

```bash
# 全局帮助
opencode --help

# 子命令帮助
opencode run --help
opencode serve --help

# 版本信息
opencode -v

# 调试模式
opencode debug

# 打印日志
opencode --print-logs

# 设置日志级别
opencode --log-level DEBUG
```

---

## 十四、常用工作流

### 1. 新项目初始化
```bash
cd my-project
opencode
# 然后在 TUI 中运行 /init
```

### 2. 快速问答
```bash
opencode run "如何优化这段 SQL 查询？"
```

### 3. 连续对话
```bash
opencode run "解释这个函数"
opencode run -c "有什么边界情况需要考虑？"
opencode run -c "帮我重写一个更安全的版本"
```

### 4. 代码审查
```bash
opencode run -f src/main.ts -f src/utils.ts "审查这些代码"
```

### 5. 多轮开发
```bash
# 创建计划
opencode --prompt "为登录功能设计 API 方案"
# 按 Tab 切换到 Plan 模式

# 实现
# 切换回 Build 模式，执行计划
```

---

## 十五、配置文件

OpenCode 配置位于：
- `~/.config/opencode/` - 全局配置
- `./.opencode/` - 项目配置

主要文件：
- `config.json` - 主配置
- `AGENTS.md` - 项目 agents 配置（/init 生成）

---

*文档生成时间：2026年*
*基于 OpenCode 官方文档整理*
