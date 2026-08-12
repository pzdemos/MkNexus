#!/usr/bin/env node
/**
 * 本地监听 → 自动打包 → 通知本机 docs serve 刷新
 */

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const http = require('http');

// ==================== 配置 ====================
const CONFIG = {
  // 监听的目录
  watchDir: path.resolve(__dirname, '../src'),
  // 忽略的文件/目录
  ignored: /(^|[\/\\])\./,  // dotfiles
  // 本机 docs serve(静态 + WebSocket 热刷新)
  local: {
    host: '127.0.0.1',
    port: 8081,
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

// ==================== 向 editor-server 推送事件 ====================
function emit(type, data) {
  const payload = JSON.stringify({ type, ...data });
  const req = http.request({
    hostname: '127.0.0.1', port: 3535, path: '/internal/deploy-event', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  });
  req.on('error', () => {});  // editor 没起也不报错
  req.write(payload); req.end();
}

// ==================== 构建函数(spawn 实时输出) ====================
function build() {
  if (isBuilding) { log.warn('正在构建中，跳过…'); return; }
  isBuilding = true;
  const t0 = Date.now();
  log.info(`${colors.bold}开始构建...${colors.reset}`);
  emit('stage', { stage: 'building', msg: '正在构建…' });

  const p = spawn('npm', ['run', 'build'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  p.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      const clean = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
      if (clean) emit('log', { msg: clean, level: 'info' });
    });
  });
  p.stderr.on('data', (d) => {
    const line = d.toString().replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (line) emit('log', { msg: line, level: 'warn' });
  });

  p.on('close', (code) => {
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    if (code === 0) {
      log.success(`${colors.green}${colors.bold}构建完成 (${dur}s)${colors.reset}`);
      emit('stage', { stage: 'built', msg: `构建完成 (${dur}s)`, duration: dur });
      deploy();
    } else {
      log.error('构建失败,exit', code);
      emit('stage', { stage: 'failed', msg: `构建失败 (exit ${code})`, duration: dur });
      isBuilding = false;
    }
  });
}

// ==================== 部署函数 ====================
function deploy() {
  log.info('dist 已更新(本机),通知 docs serve 刷新…');
  emit('stage', { stage: 'reloading', msg: '通知文档站刷新…' });
  try {
    notifyLocalReload();
  } catch (error) {
    log.error('通知失败:', error.message);
    emit('stage', { stage: 'failed', msg: '通知失败: ' + error.message });
  } finally {
    isBuilding = false;
  }
}

// ==================== 通知本机 serve 刷新 ====================
function notifyLocalReload() {
  const { host, port } = CONFIG.local;
  const data = JSON.stringify({ type: 'reload' });

  const req = http.request({
    hostname: host, port, path: '/__notify', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
  }, (res) => {
    if (res.statusCode === 200) {
      log.info('已通知 docs serve 刷新');
      emit('stage', { stage: 'done', msg: '部署完成 · 文档站已刷新' });
    } else {
      emit('stage', { stage: 'failed', msg: 'serve 返回 ' + res.statusCode });
    }
  });
  req.on('error', (err) => { emit('stage', { stage: 'failed', msg: '通知失败: ' + err.message }); });
  req.write(data); req.end();
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
  log.info(`docs serve: ${CONFIG.local.host}:${CONFIG.local.port}`);
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
