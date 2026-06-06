```bash
#!/bin/bash
# Flux SSH 隧道停止脚本 - Linux1

PID_FILE="/tmp/flux-tunnel-linux1.pid"
REMOTE_HOST="121.43.33.235"
LOCAL_PORT="9000"

echo "=========================================="
echo "   Flux SSH 隧道停止脚本 (Linux1)"
echo "=========================================="

# 停止方法1: 使用 PID 文件
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 停止隧道进程 (PID: $PID)..."
        kill $PID
        sleep 1

        # 强制杀死如果还没停止
        if ps -p $PID > /dev/null 2>&1; then
            echo "⚠️  强制停止..."
            kill -9 $PID
        fi

        echo "✅ 隧道已停止"
        rm -f "$PID_FILE"
    else
        echo "⚠️  PID 文件存在但进程不在运行"
        rm -f "$PID_FILE"
    fi
fi

# 停止方法2: 查找并杀死所有相关进程
echo "🔍 查找其他隧道进程..."
PROCS=$(pkill -f "autossh.*$REMOTE_HOST.*$LOCAL_PORT" 2>/dev/null)
PROCS+=$(pkill -f "ssh.*$LOCAL_PORT.*localhost.*$LOCAL_PORT.*$REMOTE_HOST" 2>/dev/null)

if [ -n "$PROCS" ]; then
    echo "✅ 已停止其他隧道进程"
else
    echo "ℹ️  没有发现其他运行中的隧道"
fi

echo ""
echo "=========================================="
echo "   隧道已完全停止"
echo "=========================================="
```
