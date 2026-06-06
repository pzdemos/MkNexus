# Mac 本地 ADB 反向桥接到 linux服务器

适用场景：你手边的 Mac 用 USB 连着 Android 设备，希望在 zj 主机上用 `adb` 直接看到 / 操作这台设备。Mac 通常在 NAT 后没公网入口（家用宽带 / 公司网），不能被 zj 主动 SSH 连入。

---

## 架构一句话

```
[Android USB] ─→ [Mac adb server :5037] ─SSH 反向隧道─→ [zj :5038] ←─ [zj adb client]
```

设备只对插着它的 Mac 的 adb server 可见。Mac 主动用 `ssh -R` 把自己的 `127.0.0.1:5037` 反向送到 zj 的 `127.0.0.1:5038`。zj 上 adb client 通过 `ADB_SERVER_SOCKET=tcp:127.0.0.1:5038` 走隧道连过去。

不能用 `adb -a server start` 把 5037 直接监听公网 —— 任何人都能控你手机，**只走 SSH 隧道**。

---

## 为什么 zj 端口选 5038

zj 上的 5037 端口已经被本地 adb server 用着（云手机、浏览器自动化等项目）。再叠一个 Mac 的设备进去会串台甚至误操作别人的手机。固定用 **5038** 留给 Mac 桥接，互不打架。

---

## 前置：Mac 配到 zj 的 SSH 免密（一次性）

```bash
# Mac 上
ssh-keygen -t ed25519                       # 已有跳过
ssh-copy-id claude@180.188.16.65
ssh claude@180.188.16.65 'echo ok'          # 应直接 ok 不再问密码
```

免密是必须的，autossh 才能在断线时自动重连。

---

## 步骤 1：Mac 上确认设备就绪

```bash
# Mac 上
adb start-server
adb devices
# 必须看到 device 状态（不是 unauthorized / offline）
# 首次连接需要在 Android 屏幕上点"允许此电脑 USB 调试"，勾"始终允许"
```

如果一直是 `unauthorized`：开发者选项里点"撤销 USB 调试授权"→ USB 拔插一次 → `adb kill-server && adb start-server && adb devices`，新弹窗在设备屏幕上确认。

---

## 步骤 2：测试反向隧道（裸 ssh 前台验证）

```bash
# Mac 上前台跑，验证完不要关
ssh -N -R 5038:127.0.0.1:5037 claude@180.188.16.65
```

zj 上开新终端验证：

```bash
ADB_SERVER_SOCKET=tcp:127.0.0.1:5038 adb devices
# 应看到和 Mac 上一样的设备 ID，状态 device
```

能看到设备就通了。看不到先确认：
- Mac 上 `adb devices` 本身是 device 状态吗
- zj 上 `lsof -iTCP:5038 -P -n`（注意：ssh -R 转发的端口在 zj 端 `lsof` 可能空，不代表不通，以 `adb devices` 结果为准）

---

## 步骤 3：换成 autossh 常驻

测试 ssh 窗口 Ctrl+C 关掉。Mac 上：

```bash
brew install autossh                        # 没装的话

autossh -M 0 -f -N \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  -R 5038:127.0.0.1:5037 \
  claude@180.188.16.65

ps aux | grep '[a]utossh'                   # 确认起来
```

- `-M 0`：禁用监控端口，靠 `ServerAlive*` 心跳重连
- `-f -N`：后台不执行远程命令
- `ExitOnForwardFailure=yes`：端口绑不上立即退出由 autossh 重试

---

## 步骤 4（可选）：开机自启 LaunchAgent

需要 Mac 重启后不用手动起，写：

```bash
cat > ~/Library/LaunchAgents/com.peng.adb-tunnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.peng.adb-tunnel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/autossh</string>
    <string>-M</string><string>0</string>
    <string>-N</string>
    <string>-o</string><string>ServerAliveInterval=30</string>
    <string>-o</string><string>ServerAliveCountMax=3</string>
    <string>-o</string><string>ExitOnForwardFailure=yes</string>
    <string>-R</string><string>5038:127.0.0.1:5037</string>
    <string>claude@180.188.16.65</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/adb-tunnel.log</string>
  <key>StandardErrorPath</key><string>/tmp/adb-tunnel.err</string>
</dict>
</plist>
EOF

launchctl unload ~/Library/LaunchAgents/com.peng.adb-tunnel.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.peng.adb-tunnel.plist
launchctl list | grep adb-tunnel            # 看到 PID 不是 - 就是活的
```

Intel Mac 把 `/opt/homebrew/bin/autossh` 改成 `/usr/local/bin/autossh`（用 `which autossh` 核对）。出问题看 `/tmp/adb-tunnel.err`。

---

## zj 上日常使用

```bash
# 当前 shell 临时 alias，别写进 ~/.bashrc，避免污染别的 adb 项目
alias padb='ADB_SERVER_SOCKET=tcp:127.0.0.1:5038 adb'

padb devices                                # 看设备
padb shell                                  # 进 shell
padb install -r ./xxx.apk                   # 装 APK
padb pull /sdcard/foo.png ./                # 拉文件
padb exec-out screencap -p > /tmp/s.png     # 截屏到 zj
padb shell input tap 540 1200               # 模拟点击
padb shell input text "hello"               # 输入 ASCII（中文需 ADBKeyBoard）
padb shell am start -n com.tencent.mm/.ui.LauncherUI  # 启动微信
padb logcat | grep -i error                 # 抓日志
```

中文输入：→ `facts/sops/工具/ADBKeyBoard安装与中文输入.md`

实时屏幕画面（scrcpy 风格）：zj 没显示器，走 H.264 网页推流，参考 KB `cloud-phone ctx` 里的 `duoplus-stream-3045` 方案。

---

## 常见坑

| 现象 | 原因 / 处理 |
|---|---|
| zj 上 `padb devices` 空 | Mac 端 adb server 没起 / 设备没插 / autossh 进程挂了。Mac 上先 `adb devices` 确认，再 `ps aux \| grep autossh` 看隧道 |
| 设备一直 `unauthorized` | 设备屏幕没点允许，或换了 Mac key 需要重新授权。撤销授权 → 重插 USB → 重新 `adb devices` |
| Mac 睡眠后隧道断 | 正常。Mac 唤醒后 autossh 约 30s 内重连。要 Mac 永不睡眠用 `caffeinate -d -i -m -s` 或系统设置改节能 |
| Mac 重启后没起来 | 没装 LaunchAgent。手动跑步骤 3 的 autossh 命令，或回头补步骤 4 |
| UI 自动化抓不到节点（如微信） | 微信对 uiautomator dump 做了屏蔽。换用截图坐标判断，或用辅助服务（无障碍）方案 |
| 5038 在 zj 上端口冲突 | `lsof -iTCP:5038 -P -n` 看占用。换别的口（如 5039）同步改 autossh `-R` 和 zj 端 `ADB_SERVER_SOCKET` |

---

## 关键参数速查

| 项 | 值 |
|---|---|
| zj 公网 | `claude@180.188.16.65` (SSH 默认端口 22) |
| zj 端隧道端口 | 5038 |
| Mac adb server 端口 | 5037（adb 默认） |
| zj 上 adb 连法 | `ADB_SERVER_SOCKET=tcp:127.0.0.1:5038 adb <cmd>` |
| Mac autossh 心跳 | 30s / 3 次失败重连 |
| 隧道安全 | ssh -R 默认 `GatewayPorts no`，只绑 zj 127.0.0.1，公网不可达 |
