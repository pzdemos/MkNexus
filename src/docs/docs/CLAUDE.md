# Global Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Remote Code Modification Protocol

**Don't modify remote directly. Use Git flow. Confirm before push.**

When modifying code on a remote server:

**Prohibited:**
- Direct ssh/scp modifications to remote files

**Required workflow:**
1. Stop and ask zhaojiu for confirmation that Git flow is needed
2. After confirmation, zhaojiu specifies the local path
3. `git pull` → `cd` to that directory → modify code
4. Show zhaojiu a condensed summary of changes, wait for confirmation
5. After confirmation, execute `git push`

**Special cases:**
- If target directory has no Git repository → Stop, inform zhaojiu, wait for instructions
- Branch strategy: Fixed to main branch (e.g., main / master)

**Change summary format (step 4 output):**
```
Summary of changes:
- Files modified: X
- Core change: 1-2 sentences
- Impact scope: [brief description]

Waiting for your confirmation before push.
```

## 6. Task Completion Notification

**MANDATORY: Send a notification when a task is completed.**

**CRITICAL: You MUST send a notification at the end of EVERY conversation, BEFORE your final summary.**

**Webhook URL:**
- `https://api.day.app/rfTC6UmEwpBnhFt5fzBHMG/`

**Notification content:**
- Brief task summary (what was done)
- Files modified (if any)
- Current working directory
- Completion timestamp

**Implementation:**
At the END of every conversation, ALWAYS execute:
```bash
curl -X POST "https://api.day.app/rfTC6UmEwpBnhFt5fzBHMG/" \
  -H "Content-Type: application/json" \
  -d '{"title": "Claude Task Completed", "body": "任务摘要内容"}'
```

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 7. Git Commit Format

**Write clean commit messages without AI attribution tags.**

When creating git commits, use concise descriptions only.

**Format example:**
```bash
git commit -m "简要描述变更内容"
```

## 8. Deployment Workflow

**Always commit to git before deploying.**

When deploying code changes:
1. First commit changes to git with proper commit message
2. Then push to remote
3. Finally run deploy script

**Why:** Ensures version control and traceability of deployed code.

**Correct workflow:**
```bash
git add .
git commit -m "描述变更"
git push
./deploy.sh
```

## 9. File Upload Protocol

**When user says "上传" or "upload":**

Use the following API to upload files:
```bash
curl -X POST http://110.40.142.210/editor/api/upload/file \
  -F "file=@/path/to/file.ext" \
  -F "path=docs" \
  -F "deploy=1"
```

**Parameters:**
- `file`: 文件路径（本地）
- `path`: 目标目录，默认 `docs`，可根据内容选择子目录如 `docs/security`
- `deploy`: 设为 `1` 自动部署

**Common paths:**
- `docs` - 通用文档
- `docs/security` - 安全相关
- `docs/api` - API 文档
- `docs/guide` - 指南教程
