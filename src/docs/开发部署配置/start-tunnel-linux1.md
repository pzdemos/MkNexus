```bash
#!/bin/bash
# Flux SSH 隧道启动脚本 - Linux1 (adminv1.haoaiganfan.top)

REMOTE_HOST="root@121.43.33.235"
LOCAL_PORT="9000"
REMOTE_PORT="9000"
LOG_FILE="/tmp/flux-tunnel-linux1.log"
PID_FILE="/tmp/flux-tunnel-linux1.pid"

echo "=========================================="
echo "   Flux SSH 隧道启动脚本 (Linux1)"
echo "=========================================="

# 检查 autossh 是否安装
if ! command -v autossh &> /dev/null; then
    echo "❌ autossh 未安装"
    echo ""
    echo "请先安装 autossh："
    echo "  macOS:   brew install autossh"
    echo "  Ubuntu:  sudo apt install autossh"
    exit 1
fi

# 检查是否已有隧道在运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  隧道已在运行 (PID: $OLD_PID)"
        echo ""
        read -p "是否重启隧道? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "停止旧隧道..."
            kill $OLD_PID
            sleep 2
        else
            echo "取消操作"
            exit 0
        fi
    fi
fi

# 停止可能存在的旧隧道
pkill -f "autossh.*$REMOTE_HOST.*$LOCAL_PORT"
pkill -f "ssh.*$LOCAL_PORT.*localhost.*$LOCAL_PORT.*$REMOTE_HOST"

echo "📡 启动 SSH 隧道..."
echo "   本地端口: $LOCAL_PORT"
echo "   远程主机: $REMOTE_HOST"
echo "   远程端口: $REMOTE_PORT"
echo ""

# 使用 autossh 启动隧道
autossh -M 0 \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  -o "ExitOnForwardFailure yes" \
  -N \
  -R "$REMOTE_PORT:localhost:$LOCAL_PORT" \
  "$REMOTE_HOST" \
  > "$LOG_FILE" 2>&1 &

TUNNEL_PID=$!
echo $TUNNEL_PID > "$PID_FILE"

# 等待隧道启动
echo "⏳ 等待隧道启动..."
sleep 3

# 验证隧道是否成功
if ps -p $TUNNEL_PID > /dev/null 2>&1; then
    echo "✅ 隧道启动成功!"
    echo ""
    echo "   进程 ID: $TUNNEL_PID"
    echo "   日志文件: $LOG_FILE"
    echo ""
    echo "📝 查看日志: tail -f $LOG_FILE"
    echo "🛑 停止隧道: ./stop-tunnel-linux1.sh"
    echo "🔄 查看状态: ./status-tunnel-linux1.sh"
    echo ""
    echo "=========================================="
    echo "   HTTPS 访问地址: https://adminv1.haoaiganfan.top/flux"
    echo "=========================================="
else
    echo "❌ 隧道启动失败"
    echo "   查看日志: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
```
