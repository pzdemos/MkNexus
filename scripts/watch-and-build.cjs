#!/usr/bin/env node
/**
 * 文档文件监听 + 自动构建 + 浏览器刷新通知
 * 
 * 功能：
 * - 监听 src/docs/ 目录下的 .md 文件变化
 * - 文件新增/修改/删除时自动执行 npm run build
 * - 构建完成后通知浏览器自动刷新
 * - 防抖处理，避免频繁触发构建
 * 
 * 用法：node scripts/watch-and-build.js [serverPort]
 */

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const http = require('http');

const DOCS_DIR = path.resolve(__dirname, '../src/docs');
const SERVER_PORT = process.argv[2] || 8080;
const NOTIFY_URL = `http://localhost:${SERVER_PORT}/__notify`;

// 防抖定时器
let buildTimer = null;
let isBuilding = false;
let pendingBuild = false;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  const now = new Date().toLocaleTimeString('zh-CN');
  console.log(`${colors.gray}[${now}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

// 通知浏览器刷新
function notifyBrowser(type) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ type });
    const req = http.request(
      NOTIFY_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            log(`已通知 ${result.clients} 个客户端`, 'cyan');
          } catch (e) {}
          resolve();
        });
      }
    );
    
    req.on('error', (err) => {
      // 服务器可能还没启动，静默失败
      if (err.code === 'ECONNREFUSED') {
        log('通知服务器未启动，跳过浏览器刷新通知', 'gray');
      }
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// 执行构建
async function runBuild() {
  if (isBuilding) {
    pendingBuild = true;
    log('构建进行中，排队等待...', 'yellow');
    return;
  }

  isBuilding = true;
  pendingBuild = false;
  
  log('开始构建...', 'blue');
  await notifyBrowser('building');

  const startTime = Date.now();
  
  exec('npm run build', { 
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, FORCE_COLOR: '1' }
  }, async (error, stdout, stderr) => {
    isBuilding = false;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (error) {
      log(`构建失败 (${duration}s)`, 'yellow');
      // 只显示错误摘要，避免刷屏
      const lines = stderr.split('\n').filter(l => l.includes('error'));
      lines.slice(0, 3).forEach(l => console.log('  ' + l));
    } else {
      log(`构建成功 (${duration}s)`, 'green');
      await notifyBrowser('reload');
    }
    
    // 如果有排队的构建，延迟执行
    if (pendingBuild) {
      log('执行排队中的构建...', 'blue');
      setTimeout(runBuild, 100);
    }
  });
}

// 防抖构建
function debouncedBuild(delay = 500) {
  if (buildTimer) {
    clearTimeout(buildTimer);
  }
  buildTimer = setTimeout(() => {
    runBuild();
  }, delay);
}

// 启动文件监听
log(`监听目录: ${path.relative(process.cwd(), DOCS_DIR)}`, 'cyan');
log('按 Ctrl+C 停止\n', 'gray');

const watcher = chokidar.watch(DOCS_DIR, {
  ignored: [
    /node_modules/,
    (fp) => {
      // 忽略非 .md 文件（但允许目录）
      if (!fp) return false;
      const base = path.basename(fp);
      const isDotFile = base.startsWith('.');
      const isMdFile = fp.endsWith('.md');
      const isDir = !path.extname(fp);
      if (isDotFile) return true;
      if (isDir) return false;
      return !isMdFile;
    }
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
  depth: 10,
});

watcher
  .on('add', (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const relative = path.relative(process.cwd(), filePath);
    log(`新增文档: ${relative}`, 'green');
    debouncedBuild(300);
  })
  .on('change', (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const relative = path.relative(process.cwd(), filePath);
    log(`文档修改: ${relative}`, 'blue');
    debouncedBuild(500);
  })
  .on('unlink', (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const relative = path.relative(process.cwd(), filePath);
    log(`文档删除: ${relative}`, 'yellow');
    debouncedBuild(300);
  })
  .on('error', (error) => {
    log(`监听错误: ${error.message}`, 'yellow');
  })
  .on('ready', () => {
    log('监听已就绪，等待文档变化...\n', 'cyan');
  });

// 首次构建
log('执行初始构建...', 'blue');
runBuild();

// 优雅退出
process.on('SIGINT', () => {
  log('\n停止监听', 'gray');
  watcher.close();
  process.exit(0);
});
