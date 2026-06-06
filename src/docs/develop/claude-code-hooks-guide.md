# Claude Code Hooks 完全指南

## 什么是 Hook

Hook 是一种**事件驱动机制**，在特定事件发生时自动执行预定义的命令。

```
事件发生 → 触发 Hook → 执行命令
```

就像在系统运行的某个节点挂上"钩子"，当程序运行到这个节点时，会自动执行你挂在上面的逻辑。

---

## Claude Code 支持的 Hook 类型

| Hook 事件 | 触发时机 | 典型用途 |
|-----------|----------|----------|
| **Stop** | 会话结束时 | 清理临时文件、发送通知、记录日志、上传会话摘要 |
| **UserPromptSubmit** | 用户提交提示时 | 记录输入历史、敏感词检查、输入增强、触发外部工作流 |
| **PreToolUse** | 工具执行前 | 参数验证、权限检查、审计日志、条件拦截 |
| **PostToolUse** | 工具执行后 | 结果处理、触发后续任务、状态同步、通知外部系统 |

---

## Hook 配置方法

在 `~/.claude/settings.local.json` 中添加 `hooks` 字段：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "你的 shell 命令"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "另一条命令"
          }
        ]
      }
    ]
  }
}
```

---

## 实用场景与配置示例

### 1. 会话记录自动上传

将每次会话的内容自动上传到你的文档系统：

```json
"Stop": [{
  "hooks": [{
    "type": "command",
    "command": "bash -c 'tail -n 100 ~/.claude/history.jsonl | curl -X POST http://your-api/upload -F \"file=@-/tmp/session.log\" -F \"path=claude-logs\"'"
  }]
}]
```

### 2. 工具调用审计

记录所有敏感工具的调用：

```json
"PreToolUse": [{
  "hooks": [{
    "type": "command",
    "command": "bash -c 'echo \"$(date): [$TOOL_NAME] $PWD\" >> ~/.claude/audit.log'"
  }]
}]
```

### 3. 自动备份工作目录

每次会话结束前备份当前工作：

```json
"Stop": [{
  "hooks": [{
    "type": "command",
    "command": "bash -c 'tar -czf ~/backups/session-$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null'"
  }]
}]
```

### 4. 敏感操作二次确认

在执行删除类操作前要求确认：

```json
"PreToolUse": [{
  "hooks": [{
    "type": "command",
    "command": "bash -c 'if [[ \"$TOOL_NAME\" == \"Bash\" ]] && [[ \"$COMMAND\" == *rm* ]]; then read -p \"[HOOK] 确认删除? [y/N] \" -n 1 -r; echo; [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1; fi'"
  }]
}]
```

### 5. 与外部工作流集成

触发外部系统的工作流：

```json
"Stop": [{
  "hooks": [{
    "type": "command",
    "command": "bash -c 'curl -X POST https://your-workflow-api/trigger -H \"Content-Type: application/json\" -d \"{\\\"event\\\": \\\"session_end\\\", \\\"dir\\\": \\\"$PWD\\\"}\"'"
  }]
}]
```

---

## Hook 与外部系统集成

### 基本集成方式

Hook 可以通过 `curl` 等工具与外部 API 集成，实现：

- 文件自动上传
- 消息推送通知
- 工作流触发
- 第三方服务调用

### 可用的环境变量

| 变量 | 说明 |
|------|------|
| `$PWD` | 当前工作目录 |
| `$HOME` | 用户主目录 |
| `$USER` | 当前用户名 |
| `$(date)` | 当前时间 |

**注意：** Hook 无法访问会话内容、工具结果等内部状态。

---

## Hook 调试技巧

### 1. 测试 Hook 命令

在配置前先在终端测试命令是否正常工作：

```bash
# 测试命令
bash -c 'curl -X POST http://your-api/endpoint -d "test"'
```

### 2. 查看 Hook 执行日志

Claude Code 会在执行 Hook 时输出日志，注意观察是否有错误信息。

### 3. 使用重定向记录调试信息

```json
"command": "bash -c 'your-command 2>/tmp/hook-debug.log'"
```

---

## 注意事项

1. **权限问题**：确保 Hook 命令有执行权限
2. **超时设置**：长时间运行的命令可能超时
3. **错误处理**：建议在命令中添加错误处理
4. **安全性**：避免在命令中暴露敏感信息
5. **性能影响**：避免执行耗时操作，可能影响用户体验

---

## 高级技巧

### 条件执行

只在特定条件下执行 Hook：

```bash
bash -c 'if [[ "$PWD" == *"/project/"* ]]; then # 只在项目目录执行; fi'
```

### 多 Hook 组合

同一事件可以配置多个 Hook：

```json
"Stop": [
  {
    "hooks": [{"type": "command", "command": "命令1"}]
  },
  {
    "hooks": [{"type": "command", "command": "命令2"}]
  }
]
```

---

## 配置生效

修改 `settings.local.json` 后：
- **当前会话**：不会生效
- **新会话**：自动加载新配置

---

## 总结

Hook 是扩展 Claude Code 自动化能力的强大工具。通过合理配置 Hook，可以实现：

- 会话记录的自动归档
- 与外部系统的无缝集成
- 敏感操作的额外保护
- 工作流程的自动化

记住：Hook 是系统层面的，设计简单、可靠、快速执行的命令才能获得最佳体验。
