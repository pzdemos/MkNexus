```bash
#!/bin/bash
# Flux SSH 隧道状态检查脚本 - Linux1

PID_FILE="/tmp/flux-tunnel-linux1.pid"
LOG_FILE="/tmp/flux-tunnel-linux1.log"
REMOTE_HOST="121.43.33.235"
REMOTE_PORT="9000"
DOMAIN="adminv1.haoaiganfan.top"

echo "=========================================="
echo "   Flux SSH 隧道状态 (Linux1)"
echo "=========================================="
echo ""

# 检查本地进程
LOCAL_RUNNING=false
TUNNEL_PID=""

if [ -f "$PID_FILE" ]; then
    TUNNEL_PID=$(cat "$PID_FILE")
    if ps -p $TUNNEL_PID > /dev/null 2>&1; then
        LOCAL_RUNNING=true
    fi
fi

# 额外检查 autossh 进程
if ! $LOCAL_RUNNING; then
    AUTOSSH_PID=$(pgrep -f "autossh.*$REMOTE_HOST.*$REMOTE_PORT" | head -1)
    if [ -n "$AUTOSSH_PID" ]; then
        TUNNEL_PID=$AUTOSSH_PID
        LOCAL_RUNNING=true
        echo $TUNNEL_PID > "$PID_FILE"
    fi
fi

echo "📡 本地隧道状态:"
if $LOCAL_RUNNING; then
    echo "   ✅ 运行中"
    echo "   进程 ID: $TUNNEL_PID"

    # 显示进程详细信息
    PS_INFO=$(ps -p $TUNNEL_PID -o etime,start,lstart | tail -1)
    echo "   运行时间: $(echo $PS_INFO | awk '{print $1}')"
    echo "   启动时间: $(echo $PS_INFO | cut -c10-)"
else
    echo "   ❌ 未运行"
fi

echo ""
echo "🌐 远程端口状态:"
# 检查远程端口
REMOTE_STATUS=$(ssh root@$REMOTE_HOST "netstat -tuln 2>/dev/null | grep :$REMOTE_PORT" 2>/dev/null)

if [ -n "$REMOTE_STATUS" ]; then
    echo "   ✅ 端口 $REMOTE_PORT 正在监听"
    echo "$REMOTE_STATUS" | while read line; do
        echo "   $line"
    done
else
    echo "   ❌ 端口 $REMOTE_PORT 未监听"
fi

echo ""
echo "📊 连接测试:"
# 测试 API 连接
if $LOCAL_RUNNING; then
    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$REMOTE_PORT/ 2>/dev/null)
    if [ "$API_TEST" = "200" ]; then
        echo "   ✅ 本地 API: 正常 (HTTP $API_TEST)"
    else
        echo "   ⚠️  本地 API: 异常 (HTTP $API_TEST)"
    fi

    REMOTE_API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/flux/ 2>/dev/null)
    if [ "$REMOTE_API_TEST" = "200" ]; then
        echo "   ✅ 远程 API: 正常 (HTTP $REMOTE_API_TEST)"
    else
        echo "   ⚠️  远程 API: 异常 (HTTP $REMOTE_API_TEST)"
    fi
else
    echo "   ⏸️  隧道未运行，跳过连接测试"
fi

echo ""
echo "📝 最近日志:"
if [ -f "$LOG_FILE" ]; then
    tail -5 "$LOG_FILE" | sed 's/^/   /'
else
    echo "   (无日志文件)"
fi

echo ""
echo "=========================================="

# 返回状态码
if $LOCAL_RUNNING; then
    exit 0
else
    exit 1
fi
```
