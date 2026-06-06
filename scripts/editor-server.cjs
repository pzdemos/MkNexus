#!/usr/bin/env node
/**
 * MkNexus Markdown 编辑器服务
 * 独立运行，提供 markdown 文件编辑功能
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = 3535;

// 目录配置
const DOCS_DIR = path.resolve(__dirname, '../src/docs');
const TEMP_DIR = path.resolve(__dirname, '../.editor-temp');

// 确保 temp 目录存在
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer 配置（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../editor-ui')));

// ==================== 工具函数 ====================

/**
 * 获取目录下的所有 markdown 文件
 */
function getFiles(dir, basePath = '') {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(basePath, item);

    if (stat.isDirectory()) {
      files.push({
        name: item,
        path: relativePath,
        isDirectory: true,
        children: getFiles(fullPath, relativePath),
      });
    } else if (item.endsWith('.md')) {
      files.push({
        name: item,
        path: relativePath,
        isDirectory: false,
      });
    }
  }

  return files;
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
  const fullPath = path.join(TEMP_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    // 如果临时文件不存在，从正式目录读取
    const officialPath = path.join(DOCS_DIR, filePath);
    if (fs.existsSync(officialPath)) {
      return fs.readFileSync(officialPath, 'utf-8');
    }
    return '';
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * 写入文件到临时目录
 */
function writeFile(filePath, content) {
  const fullPath = path.join(TEMP_DIR, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
}

/**
 * 删除文件（临时目录和正式目录）
 */
function deleteFile(filePath, deleteOfficial = true) {
  // 删除临时目录的文件
  const tempPath = path.join(TEMP_DIR, filePath);
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  // 删除正式目录的文件（可选）
  if (deleteOfficial) {
    const officialPath = path.join(DOCS_DIR, filePath);
    if (fs.existsSync(officialPath)) {
      fs.unlinkSync(officialPath);
    }
  }
}

/**
 * 获取临时文件列表（有修改的文件）
 */
function getTempFiles() {
  const files = [];
  const scanDir = (dir, basePath = '') => {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      const relativePath = path.join(basePath, item);

      // 跳过内部文件
      if (item === '.delete-list' || item.startsWith('.')) {
        continue;
      }

      if (stat.isDirectory()) {
        scanDir(fullPath, relativePath);
      } else {
        files.push(relativePath);
      }
    }
  };

  if (fs.existsSync(TEMP_DIR)) {
    scanDir(TEMP_DIR);
  }

  return files;
}

// ==================== API 路由 ====================

/**
 * 获取改动详情
 */
function getChangeDetails() {
  const tempFiles = getTempFiles();
  const changes = [];

  // 读取删除列表
  const deleteListPath = path.join(TEMP_DIR, '.delete-list');
  const deleteList = fs.existsSync(deleteListPath)
    ? JSON.parse(fs.readFileSync(deleteListPath, 'utf-8'))
    : [];

  for (const filePath of tempFiles) {
    const officialPath = path.join(DOCS_DIR, filePath);
    const tempPath = path.join(TEMP_DIR, filePath);

    if (deleteList.includes(filePath)) {
      // 文件被移动了（旧位置在删除列表，新位置在临时目录）
      changes.push({ path: filePath, type: 'moved' });
    } else if (fs.existsSync(officialPath)) {
      // 文件已存在，是修改
      changes.push({ path: filePath, type: 'modified' });
    } else {
      // 文件不存在，是新建
      changes.push({ path: filePath, type: 'created' });
    }
  }

  // 添加待删除的文件
  for (const filePath of deleteList) {
    if (!tempFiles.includes(filePath)) {
      changes.push({ path: filePath, type: 'deleted' });
    }
  }

  return changes;
}

// 获取文件列表
app.get('/api/files', (req, res) => {
  try {
    const files = getFiles(DOCS_DIR);
    const tempFiles = getTempFiles();
    const changes = getChangeDetails();

    res.json({
      files,
      modified: tempFiles,
      changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取文件内容
app.get('/api/file/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const content = readFile(filePath);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存文件到临时目录（检查改动）
app.post('/api/file/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const { content } = req.body;

    // 获取当前文件内容
    const currentContent = readFile(filePath);

    // 检查是否有改动
    if (currentContent === content) {
      return res.json({ success: true, unchanged: true, message: '文件未改动' });
    }

    // 有改动，保存到临时目录
    writeFile(filePath, content);
    res.json({ success: true, unchanged: false, message: '已保存' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新建文件
app.post('/api/new/:path(*)', (req, res) => {
  try {
    const dirPath = req.params.path || '';
    const { name } = req.body;

    const fullPath = path.join(TEMP_DIR, dirPath, name);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, '# New Document\n', 'utf-8');
    res.json({ success: true, path: path.join(dirPath, name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新建目录
app.post('/api/folder/:path(*)', (req, res) => {
  try {
    const basePath = req.params.path || '';
    const { name } = req.body;

    // 同时创建到正式目录和临时目录，确保立即可见
    const tempPath = path.join(TEMP_DIR, basePath, name);
    const docPath = path.join(DOCS_DIR, basePath, name);
    fs.mkdirSync(tempPath, { recursive: true });
    fs.mkdirSync(docPath, { recursive: true });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 重命名文件或目录
app.post('/api/rename/:path(*)', (req, res) => {
  try {
    const oldPath = req.params.path;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: '新名称不能为空' });
    }

    // 构建完整路径
    const fullOldPath = path.join(TEMP_DIR, oldPath);
    const fullOldPathOfficial = path.join(DOCS_DIR, oldPath);
    const dir = path.dirname(fullOldPath);
    const fullNewPath = path.join(dir, newName);
    const relativeNewPath = path.join(path.dirname(oldPath), newName);

    // 检查是否存在于临时目录
    const existsInTemp = fs.existsSync(fullOldPath);
    // 检查是否存在于正式目录
    const existsInOfficial = fs.existsSync(fullOldPathOfficial);

    if (!existsInTemp && !existsInOfficial) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 如果在临时目录存在，直接重命名
    if (existsInTemp) {
      fs.renameSync(fullOldPath, fullNewPath);
    } else {
      // 如果在正式目录，复制到临时目录并用新名称
      const newTempPath = path.join(TEMP_DIR, relativeNewPath);
      const newDir = path.dirname(newTempPath);

      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }

      fs.copyFileSync(fullOldPathOfficial, newTempPath);

      // 标记旧文件为待删除
      const deleteListPath = path.join(TEMP_DIR, '.delete-list');
      let deleteList = [];
      if (fs.existsSync(deleteListPath)) {
        deleteList = JSON.parse(fs.readFileSync(deleteListPath, 'utf-8'));
      }
      if (!deleteList.includes(oldPath)) {
        deleteList.push(oldPath);
      }
      fs.writeFileSync(deleteListPath, JSON.stringify(deleteList, null, 2));
    }

    res.json({ success: true, newPath: relativeNewPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除文件或目录
app.delete('/api/file/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const tempPath = path.join(TEMP_DIR, filePath);
    const officialPath = path.join(DOCS_DIR, filePath);

    // 判断是文件还是目录
    const isDirectory = fs.existsSync(officialPath) ?
      fs.statSync(officialPath).isDirectory() :
      (fs.existsSync(tempPath) && fs.statSync(tempPath).isDirectory());

    // 添加到删除列表
    const deleteListPath = path.join(TEMP_DIR, '.delete-list');
    let deleteList = [];
    if (fs.existsSync(deleteListPath)) {
      deleteList = JSON.parse(fs.readFileSync(deleteListPath, 'utf-8'));
    }
    if (!deleteList.includes(filePath)) {
      deleteList.push(filePath);
    }
    fs.writeFileSync(deleteListPath, JSON.stringify(deleteList, null, 2));

    // 删除临时文件/目录
    if (fs.existsSync(tempPath)) {
      if (isDirectory) {
        fs.rmSync(tempPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(tempPath);
      }
    }

    // 自动部署
    const deployed = deployFiles();

    const message = isDirectory ? '目录已删除并部署' : '文件已删除并部署';
    res.json({ success: true, message, deployed, isDirectory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 部署逻辑（可复用）
function deployFiles() {
  // 1. 复制临时文件到正式目录
  const tempFiles = getTempFiles();

  for (const file of tempFiles) {
    const srcPath = path.join(TEMP_DIR, file);
    const destPath = path.join(DOCS_DIR, file);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(srcPath, destPath);
  }

  // 2. 处理删除列表
  const deleteListPath = path.join(TEMP_DIR, '.delete-list');
  if (fs.existsSync(deleteListPath)) {
    const deleteList = JSON.parse(fs.readFileSync(deleteListPath, 'utf-8'));

    for (const item of deleteList) {
      const itemPath = path.join(DOCS_DIR, item);
      if (fs.existsSync(itemPath)) {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
      }
    }

    fs.unlinkSync(deleteListPath);
  }

  // 3. 清空临时目录
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  return tempFiles;
}

// 外部上传 API（供外部工具调用）
app.post('/api/upload', (req, res) => {
  try {
    const { path: filePath, content, deploy } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: '缺少 path 参数' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: '缺少 content 参数' });
    }

    // 保存到临时目录
    writeFile(filePath, content);

    // 只有 deploy=1 时才部署
    let deployed = null;
    if (deploy === 1 || deploy === '1') {
      deployed = deployFiles();
    }

    res.json({
      success: true,
      message: deployed ? '文件已部署' : '文件已保存',
      path: filePath,
      deployed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 外部文件上传 API（支持 multipart/form-data）
app.post('/api/upload/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 获取目标路径（默认根目录，可通过 form 字段指定）
    const targetDir = req.body.path || '';
    const fileName = req.file.originalname;
    const filePath = targetDir ? `${targetDir}/${fileName}` : fileName;

    // 创建目标目录
    const fullPath = path.join(TEMP_DIR, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 保存文件内容
    fs.writeFileSync(fullPath, req.file.buffer);

    // 只有 deploy=1 时才部署
    let deployed = null;
    if (req.body.deploy === '1' || req.body.deploy === 1) {
      deployed = deployFiles();
    }

    res.json({
      success: true,
      message: deployed ? '文件已部署' : '文件已保存',
      path: filePath,
      fileName: fileName,
      deployed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 移动文件 API（用于拖拽移动）
app.post('/api/move', (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: '缺少 from 或 to 参数' });
    }

    // 获取文件名
    const fileName = from.includes('/') ? from.substring(from.lastIndexOf('/') + 1) : from;
    const newPath = to ? `${to}/${fileName}` : fileName;

    // 检查是否移动到同一个目录
    const fromDir = from.includes('/') ? from.substring(0, from.lastIndexOf('/')) : '';
    const toDir = to;

    if (fromDir === toDir) {
      return res.json({
        success: true,
        message: '文件已在目标目录中'
      });
    }

    // 读取原文件内容（从正式目录）
    const officialPath = path.join(DOCS_DIR, from);
    let content = '';
    if (fs.existsSync(officialPath)) {
      content = fs.readFileSync(officialPath, 'utf-8');
    } else {
      // 如果正式目录不存在，尝试从临时目录读取
      const tempPath = path.join(TEMP_DIR, from);
      if (fs.existsSync(tempPath)) {
        content = fs.readFileSync(tempPath, 'utf-8');
      }
    }

    // 在新位置创建文件（写入临时目录，这样 modified 会包含它）
    writeFile(newPath, content);

    // 将原文件路径添加到 delete-list（部署时删除旧位置）
    const deleteListPath = path.join(TEMP_DIR, '.delete-list');
    let deleteList = [];
    if (fs.existsSync(deleteListPath)) {
      deleteList = JSON.parse(fs.readFileSync(deleteListPath, 'utf-8'));
    }
    if (!deleteList.includes(from)) {
      deleteList.push(from);
    }
    fs.writeFileSync(deleteListPath, JSON.stringify(deleteList, null, 2));

    res.json({
      success: true,
      message: '文件已移动，请部署后生效',
      newPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 部署到正式目录
app.post('/api/deploy', (req, res) => {
  try {
    const deployed = deployFiles();
    res.json({
      success: true,
      message: `已部署 ${deployed.length} 个文件`,
      deployed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 清空所有修改
app.post('/api/clear', (req, res) => {
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取消单个文件的修改
app.delete('/api/temp/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const tempPath = path.join(TEMP_DIR, filePath);

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    res.json({ success: true, message: '修改已取消' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  📝 MkNexus 编辑器`);
  console.log(`  ─────────────────────────────`);
  console.log(`  本地访问: http://localhost:${PORT}`);
  console.log(`  外网访问: http://121.43.33.235:${PORT}`);
  console.log(`  文档目录: ${DOCS_DIR}`);
  console.log(`  临时目录: ${TEMP_DIR}`);
  console.log(`  ─────────────────────────────\n`);
});
