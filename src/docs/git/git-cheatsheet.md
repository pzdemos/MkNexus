# Git 常用操作速查

## 配置

```bash
git config --global user.name "your name"
git config --global user.email "your@email.com"
```

## 仓库

```bash
git init              # 初始化新仓库
git clone <url>       # 克隆远程仓库
```

## 日常基本流程

```bash
git status            # 查状态
git add <file>        # 暂存（放购物车）
git add .             # 暂存所有
git commit -m "备注"   # 提交（拍照存档）
git commit -am "备注"  # 跳过 add（仅跟踪过的文件）
```

## 分支

```bash
git branch                    # 查看分支
git branch <name>             # 创建分支（不切换）
git checkout <name>           # 切换分支
git checkout -b <name>        # 创建并切换（开平行宇宙）
git switch -c <name>          # 新版创建并切换
git merge <branch>            # 合并分支到当前
git branch -d <name>          # 删除分支
```

## 同步远程

```bash
git push                      # 推送
git push -u origin <branch>   # 首次推送并建立关联
git pull                      # 拉取并合并
git fetch                     # 拉取不合并
git remote -v                 # 查看远程地址
```

## 撤销与回滚

| 命令 | 工作区 | 暂存区 | HEAD | 安全吗 |
|------|--------|--------|------|--------|
| `git reset HEAD <file>` | ❌不动 | ✅清空 | ❌不动 | ✅ |
| `git reset --soft HEAD~1` | ❌不动 | ❌不动 | ✅回退 | ✅ |
| `git reset --mixed HEAD~1` (默认) | ❌不动 | ✅清空 | ✅回退 | ⚠️ |
| `git reset --hard HEAD~1` | ✅还原 | ✅清空 | ✅回退 | ❌丢代码 |

```bash
git checkout -- <file>        # 丢弃工作区修改
git revert <commit>           # 安全撤销（生成新提交）
git reset --hard <commit>     # 强制回退（危险！）
```

### 后悔了怎么办

```bash
git reflog                    # 看所有操作历史
git reset --hard <那个hash>   # --hard 了也能救回来
```

## 贮藏

```bash
git stash         # 藏起当前修改
git stash pop     # 恢复并删除
git stash list    # 查看列表
git stash drop    # 删除指定贮藏
```

## 查看历史

```bash
git log                  # 完整日志
git log --oneline        # 一行一个提交
git log --graph          # 图形化显示
git log --oneline --graph --all  # 看全部分支
git diff                 # 工作区 vs 暂存区
git diff --cached        # 暂存区 vs 仓库
```

## 标签

```bash
git tag                  # 查看标签
git tag <name>           # 打标签
git push --tags          # 推送所有标签
```

## 保命提醒

| 禁忌 | 原因 |
|------|------|
| ❌ 公共分支 `reset --hard` | 会删别人提交 |
| ❌ 随便 `push -f` | 强制覆盖远程，坑队友 |
| ❌ 提交密码/密钥 | 暴露后历史里删不干净 |
| ❌ 提交大二进制文件 | 仓库越来越臃肿 |
| ✅ 频繁小步提交 | 每个提交做一件事，方便回滚 |
| ✅ 配 `.gitignore` | 避免提交 `node_modules`/`.env` |
| ✅ 写清楚 commit 备注 | "fix" 不如"修复登录页按钮无响应" |

## 一句话总结

> **`git add` 挑文件 → `git commit` 拍快照 → `git push` 上传 → `git pull` 下载 → `git checkout -b` 开平行宇宙 → `git merge` 合并平行宇宙**
