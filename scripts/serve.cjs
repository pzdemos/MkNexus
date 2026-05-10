#!/usr/bin/env node
/**
 * 静态文件服务器 + WebSocket 实时刷新
 * 
 * 功能：
 * - 提供 dist/ 目录的静态文件服务
 * - WebSocket 服务器，用于接收构建完成通知
 * - 收到通知后向所有浏览器客户端推送刷新指令
 * 
 * 用法：node scripts/serve.cjs [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const serveHandler = require('serve-handler');
const WebSocket = require('ws');

const PORT = process.argv[2] || 8080;
const DIST_DIR = path.resolve(__dirname, '../dist');

const clients = new Set();

// 广播消息给所有连接的客户端
function broadcast(message) {
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 注入实时刷新客户端代码
const WS_SCRIPT = `
<script>
(function() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + window.location.host + '/__ws';
  let ws = null;
  let reconnectTimer = null;
  let connectCount = 0;
  
  function connect() {
    if (ws) return;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      connectCount = 0;
      console.log('[LiveReload] WebSocket 已连接');
    };
    
    ws.onmessage = function(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'reload') {
          console.log('[LiveReload] 文档已更新，正在刷新...');
          setTimeout(function() {
            window.location.reload();
          }, 300);
        }
        if (msg.type === 'building') {
          console.log('[LiveReload] 正在重新构建...');
        }
      } catch(e) {}
    };
    
    ws.onclose = function() {
      ws = null;
      connectCount++;
      const delay = Math.min(connectCount * 1000, 10000);
      reconnectTimer = setTimeout(connect, delay);
    };
    
    ws.onerror = function() {
      ws.close();
    };
  }
  
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !ws) {
      connect();
    }
  });
  
  connect();
})();
</script>`;

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. 处理通知 API（最高优先级）
  if (req.url === '/__notify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        broadcast(msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, clients: clients.size }));
      } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
    return;
  }

  // 2. 首页注入 WebSocket 刷新脚本
  if (req.url === '/' || req.url === '/index.html') {
    const indexPath = path.join(DIST_DIR, 'index.html');
    
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to load index.html');
        return;
      }
      
      const modified = data.replace('</body>', WS_SCRIPT + '\n</body>');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(modified);
    });
    return;
  }

  // 3. 静态文件服务
  serveHandler(req, res, {
    public: DIST_DIR,
    cleanUrls: true,
  });
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/__ws',
});

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`\n  🔷 MkNexus`);
  console.log(`  ─────────────────────`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  文档目录: src/docs/`);
  console.log(`  ─────────────────────\n`);
});

module.exports = { broadcast, clients };
