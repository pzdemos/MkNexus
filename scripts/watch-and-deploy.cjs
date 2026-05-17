#!/usr/bin/env node
/**
 * 本地监听 → 自动打包 → 自动部署到远程服务器
 */

const { execSync } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  // 监听的目录
  watchDir: path.resolve(__dirname, '../src'),
  // 忽略的文件/目录
  ignored: /(^|[\/\\])\../,  // dotfiles
  // 远程服务器配置
  remote: {
    host: 'root@121.43.33.235',
    path: '/var/server/MkNexus/dist',
    port: 8080,  // WebSocket 通知端口
  },
  // 部署延迟（毫秒）- 避免频繁构建
  debounceDelay: 500,
};

// ==================== 工具函数 ====================
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ⓘ${colors.reset}`, msg),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}`, msg),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}`, msg),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}`, msg),
};

let buildTimer = null;
let isBuilding = false;

// ==================== 构建函数 ====================
function build() {
  if (isBuilding) {
    log.warn('正在构建中，跳过本次触发...');
    return;
  }

  isBuilding = true;
  log.info(`${colors.bold}开始构建...${colors.reset}`);

  try {
    // 执行构建
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    log.success(`${colors.green}${colors.bold}构建完成${colors.reset}`);
    deploy();
  } catch (error) {
    log.error('构建失败:', error.message);
    isBuilding = false;
  }
}

// ==================== 部署函数 ====================
function deploy() {
  log.info('正在部署到远程服务器...');

  const { host, path: remotePath } = CONFIG.remote;

  try {
    // rsync 同步 dist 目录到远程
    // -a: 归档模式，保留权限
    // -v: 详细输出
    // -z: 压缩传输
    // --delete: 删除远程不存在的文件
    execSync(
      `rsync -avz --delete dist/ ${host}:${remotePath}/`,
      {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      }
    );

    log.success(`${colors.green}${colors.bold}部署完成！${colors.reset}`);

    // 通知远程服务器刷新（可选）
    notifyRemoteReload();
  } catch (error) {
    log.error('部署失败:', error.message);
  } finally {
    isBuilding = false;
  }
}

// ==================== 通知远程刷新 ====================
function notifyRemoteReload() {
  const http = require('http');
  const { port } = CONFIG.remote;

  const data = JSON.stringify({ type: 'reload' });

  const options = {
    hostname: '121.43.33.235',
    port: port,
    path: '/__notify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      log.info('已通知远程服务器刷新');
    }
  });

  req.on('error', (err) => {
    // 静默处理，不影响部署流程
  });

  req.write(data);
  req.end();
}

// ==================== 文件变化处理 ====================
function handleChange(filePath) {
  log.info(`${colors.gray}文件变化: ${filePath}${colors.reset}`);

  // 防抖处理
  if (buildTimer) {
    clearTimeout(buildTimer);
  }

  buildTimer = setTimeout(() => {
    build();
  }, CONFIG.debounceDelay);
}

// ==================== 启动监听 ====================
function start() {
  console.log(`${colors.cyan}${colors.bold}\n🚀 MkNexus 本地监听部署${colors.reset}`);
  console.log(`${colors.gray}─${'─'.repeat(39)}${colors.reset}`);
  log.info(`监听目录: ${CONFIG.watchDir}`);
  log.info(`远程服务器: ${CONFIG.remote.host}`);
  log.info(`远程路径: ${CONFIG.remote.path}`);
  console.log(`${colors.gray}─${'─'.repeat(39)}${colors.reset}`);

  // 初始构建一次
  log.info('执行初始构建...');
  build();

  // 启动文件监听
  const watcher = chokidar.watch(CONFIG.watchDir, {
    ignored: CONFIG.ignored,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', handleChange)
    .on('error', (error) => log.error('监听错误:', error));

  // 退出处理
  process.on('SIGINT', () => {
    log.info('\n正在停止监听...');
    watcher.close();
    process.exit(0);
  });
}

// ==================== 检查依赖 ====================
function checkDependencies() {
  try {
    require('chokidar');
  } catch (e) {
    log.error('缺少依赖 chokidar，请运行: npm install chokidar chalk');
    process.exit(1);
  }
}

// ==================== 启动 ====================
checkDependencies();
start();
