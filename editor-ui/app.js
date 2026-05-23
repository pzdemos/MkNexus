// API 基础地址
const API = '';

// 状态
let currentFile = null;
let currentDir = '';
let files = [];
let modified = [];
let changes = [];
let isPreviewMode = false;
let draggedItem = null;
let changesExpanded = false;

// DOM 元素
const fileTree = document.getElementById('fileTree');
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const filePathEl = document.getElementById('filePath');
const saveBtn = document.getElementById('saveBtn');
const modifiedIndicator = document.getElementById('modifiedIndicator');
const modifiedCount = document.querySelector('.modified-count');
const newFileDialog = document.getElementById('newFileDialog');
const newFileNameInput = document.getElementById('newFileName');
const newFolderDialog = document.getElementById('newFolderDialog');
const newFolderNameInput = document.getElementById('newFolderName');
const renameDialog = document.getElementById('renameDialog');
const renameInput = document.getElementById('renameInput');
const uploadDialog = document.getElementById('uploadDialog');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const confirmUploadBtn = document.getElementById('confirmUpload');
const apiInfoBtn = document.getElementById('apiInfoBtn');
const apiInfo = document.getElementById('apiInfo');

// 确认对话框
const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');

function showConfirm(title, message) {
  return new Promise(resolve => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.onclick = () => { confirmDialog.close(); resolve(true); };
    confirmCancel.onclick = () => { confirmDialog.close(); resolve(false); };
    confirmDialog.showModal();
  });
}

confirmDialog.addEventListener('click', (e) => {
  if (e.target === confirmDialog) {
    confirmDialog.close();
  }
});

// Toast 通知
function toast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-remove');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// 加载状态
let loadingCount = 0;

function showLoading() {
  loadingCount++;
  if (loadingCount === 1) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    overlay.appendChild(spinner);
    document.querySelector('.main').appendChild(overlay);
  }
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
  }
}

// 动态设置 API URL
const currentApiUrl = window.location.origin + '/editor/api/upload';
if (document.getElementById('apiUrl')) {
  document.getElementById('apiUrl').textContent = currentApiUrl;
  document.getElementById('apiCurl').textContent = `curl -X POST ${currentApiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "guide/example.md",
    "content": "# 新文档\\n\\n内容..."
  }'`;
  document.getElementById('apiFileCurl').textContent = `curl -X POST ${currentApiUrl}/file \\
  -F "file=@/path/to/document.md" \\
  -F "path=guide"`;
}

// 初始化 marked
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

// ==================== 文件操作 ====================

async function loadFiles() {
  showLoading();
  try {
    const res = await fetch(`${API}/api/files`);
    const data = await res.json();
    files = data.files;
    modified = data.modified;
    changes = data.changes || [];
    renderFileTree();
    updateModifiedIndicator();
    renderChangesList();
  } catch (error) {
    toast('加载文件失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderFileTree() {
  fileTree.innerHTML = renderTreeItems(files);
  attachDragEvents();
}

function renderTreeItems(items, level = 0) {
  return items.map(item => {
    const isModified = modified.includes(item.path);
    const isActive = currentFile === item.path;

    if (item.isDirectory) {
      return `
        <div class="tree-item tree-folder"
             style="padding-left: ${8 + level * 16}px"
             data-path="${item.path}"
             data-type="folder"
             draggable="true">
          <span class="tree-icon">📁</span>
          <span class="tree-name">${item.name}</span>
          <span class="tree-rename">✎</span>
        </div>
        <div class="tree-children">
          ${item.children ? renderTreeItems(item.children, level + 1) : ''}
        </div>
      `;
    } else {
      return `
        <div class="tree-item ${isActive ? 'active' : ''} ${isModified ? 'modified' : ''}"
             style="padding-left: ${8 + level * 16}px"
             data-path="${item.path}"
             data-type="file"
             draggable="true">
          <span class="tree-icon">📄</span>
          <span class="tree-name">${item.name}</span>
          <span class="tree-rename">✎</span>
          <span class="tree-delete">✕</span>
        </div>
      `;
    }
  }).join('');
}

async function openFile(path) {
  currentFile = path;
  currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
  filePathEl.textContent = path;
  saveBtn.disabled = false;
  showLoading();

  try {
    const res = await fetch(`${API}/api/file/${encodeURIComponent(path)}`);
    const data = await res.json();
    editor.value = data.content;
    updatePreview();
    renderFileTree();
  } catch (error) {
    toast('打开文件失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveFile() {
  if (!currentFile) return;
  showLoading();

  try {
    const res = await fetch(`${API}/api/file/${encodeURIComponent(currentFile)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editor.value }),
    });

    const data = await res.json();

    if (data.unchanged) {
      hideLoading();
      return;
    }

    await loadFiles();
    showSaveSuccess();
    toast('已保存', 'success', 1500);
  } catch (error) {
    toast('保存失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteFile(path, event) {
  event.stopPropagation();

  const confirmed = await showConfirm('删除文件', `确定要删除 ${path} 吗？此操作不可撤销。`);
  if (!confirmed) return;

  showLoading();
  try {
    await fetch(`${API}/api/file/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (currentFile === path) {
      currentFile = null;
      currentDir = '';
      editor.value = '';
      filePathEl.textContent = '未选择文件';
      saveBtn.disabled = true;
    }

    await loadFiles();
    toast('已删除: ' + path, 'success', 2000);
  } catch (error) {
    toast('删除失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function renameItem(path, type, event) {
  event.stopPropagation();

  const oldName = path.split('/').pop();
  renameInput.value = oldName;
  renameDialog.dataset.path = path;
  renameDialog.showModal();
}

async function renameItemConfirm() {
  const path = renameDialog.dataset.path;
  const newName = renameInput.value.trim();

  if (!newName) return;

  showLoading();
  try {
    const res = await fetch(`${API}/api/rename/${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    });

    const data = await res.json();
    await loadFiles();

    if (currentFile === path) {
      openFile(data.newPath);
    }

    renameDialog.close();
    toast('已重命名', 'success', 1500);
  } catch (error) {
    toast('重命名失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function createFile() {
  const name = newFileNameInput.value.trim();
  if (!name) return;

  if (!name.endsWith('.md')) {
    toast('文件名必须以 .md 结尾', 'warning');
    return;
  }

  showLoading();
  try {
    const res = await fetch(`${API}/api/new/${encodeURIComponent(currentDir)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    await loadFiles();
    openFile(data.path);
    newFileDialog.close();
    newFileNameInput.value = '';
    toast('已创建: ' + name, 'success', 1500);
  } catch (error) {
    toast('创建文件失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function createFolder() {
  newFolderNameInput.value = '';
  newFolderDialog.showModal();
}

async function createFolderConfirm() {
  const name = newFolderNameInput.value.trim();
  if (!name) return;

  showLoading();
  try {
    await fetch(`${API}/api/folder/${encodeURIComponent(currentDir)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    await loadFiles();
    newFolderDialog.close();
    newFolderNameInput.value = '';
    toast('已创建目录: ' + name, 'success', 1500);
  } catch (error) {
    toast('创建目录失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function uploadFiles(fileList) {
  showLoading();
  let uploaded = 0;
  let skipped = 0;

  for (const file of fileList) {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      skipped++;
      continue;
    }

    try {
      const content = await file.text();

      await fetch(`${API}/api/new/${encodeURIComponent(currentDir)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name }),
      });

      const newPath = currentDir ? `${currentDir}/${file.name}` : file.name;

      await fetch(`${API}/api/file/${encodeURIComponent(newPath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      uploaded++;
    } catch (error) {
      toast(`上传 ${file.name} 失败: ${error.message}`, 'error');
    }
  }

  await loadFiles();
  hideLoading();
  uploadDialog.close();

  if (uploaded > 0) {
    toast(`成功上传 ${uploaded} 个文件` + (skipped > 0 ? `，跳过 ${skipped} 个` : ''), 'success', 2000);
  }
}

async function moveItem(itemPath, targetDir) {
  showLoading();
  try {
    const fileName = itemPath.split('/').pop();
    const oldDir = itemPath.includes('/') ? itemPath.substring(0, itemPath.lastIndexOf('/')) : '';
    const newPath = targetDir ? `${targetDir}/${fileName}` : fileName;

    if (oldDir === targetDir) {
      hideLoading();
      return;
    }

    const contentRes = await fetch(`${API}/api/file/${encodeURIComponent(itemPath)}`);
    const contentData = await contentRes.json();

    await fetch(`${API}/api/new/${encodeURIComponent(targetDir)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fileName }),
    });

    await fetch(`${API}/api/file/${encodeURIComponent(newPath)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: contentData.content }),
    });

    await fetch(`${API}/api/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: itemPath,
        to: newPath
      }),
    });

    await loadFiles();

    if (currentFile === itemPath) {
      openFile(newPath);
    }

    toast('已移动', 'success', 1500);
  } catch (error) {
    toast('移动失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deploy() {
  if (modified.length === 0) return;

  const confirmed = await showConfirm('部署文件', `确定要部署 ${modified.length} 个文件吗？这将把修改同步到正式目录。`);
  if (!confirmed) return;

  showLoading();
  try {
    const res = await fetch(`${API}/api/deploy`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      await loadFiles();
      toast(data.message, 'success', 3000);
    }
  } catch (error) {
    toast('部署失败: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function updateModifiedIndicator() {
  if (modified.length > 0) {
    modifiedIndicator.style.display = 'flex';
    modifiedCount.textContent = modified.length;
  } else {
    modifiedIndicator.style.display = 'none';
  }
}

function renderChangesList() {
  const changesList = document.getElementById('changesList');

  if (changes.length === 0) {
    changesList.innerHTML = '<div class="changes-empty">暂无改动</div>';
    return;
  }

  const typeLabels = {
    created: '+',
    modified: '~',
    deleted: '×',
    moved: '→'
  };

  const typeNames = {
    created: '新建',
    modified: '修改',
    deleted: '删除',
    moved: '移动'
  };

  changesList.innerHTML = changes.map(change => `
    <div class="change-item">
      <span class="change-type ${change.type}" title="${typeNames[change.type]}">${typeLabels[change.type]}</span>
      <span class="change-path">${change.path}</span>
    </div>
  `).join('');
}

function toggleChanges() {
  changesExpanded = !changesExpanded;
  const changesList = document.getElementById('changesList');
  const toggleBtn = document.getElementById('toggleChanges');

  if (changesExpanded) {
    changesList.style.display = 'block';
    toggleBtn.classList.add('expanded');
  } else {
    changesList.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
}

function updatePreview() {
  if (isPreviewMode) {
    preview.innerHTML = marked.parse(editor.value);
  }
}

function togglePreview() {
  isPreviewMode = !isPreviewMode;

  const editorWrapper = document.getElementById('editorWrapper');
  const previewWrapper = document.getElementById('previewWrapper');
  const toggleBtn = document.getElementById('previewToggle');

  if (isPreviewMode) {
    editorWrapper.style.display = 'none';
    previewWrapper.style.display = 'block';
    toggleBtn.textContent = '编辑';
    updatePreview();
  } else {
    editorWrapper.style.display = 'block';
    previewWrapper.style.display = 'none';
    toggleBtn.textContent = '预览';
  }
}

function showSaveSuccess() {
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '✓ 已保存';
  saveBtn.style.background = 'var(--success)';
  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = '';
  }, 1500);
}

// ==================== API 复制功能 ====================

function copyText(text, btn) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    const originalText = btn.textContent;
    btn.textContent = '已复制';
    setTimeout(() => btn.textContent = originalText, 1500);
  } catch (e) {
    console.error('复制失败:', e);
  }
  document.body.removeChild(ta);
}

document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.copy;
    const source = document.getElementById(targetId);
    if (source) {
      copyText(source.textContent, btn);
    }
  });
});

// ==================== 拖动功能 ====================

function attachDragEvents() {
  const items = document.querySelectorAll('.tree-item');

  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedItem = e.target.closest('.tree-item');
  draggedItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.closest('.tree-item')?.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  const target = e.target.closest('.tree-item');
  if (target && target !== draggedItem) {
    target.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  e.target.closest('.tree-item')?.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const target = e.target.closest('.tree-item');

  if (!target || !draggedItem || target === draggedItem) return;

  const sourcePath = draggedItem.dataset.path;
  const targetPath = target.dataset.path;
  const targetType = target.dataset.type;

  if (targetType !== 'folder') {
    toast('只能移动到文件夹中', 'warning');
    return;
  }

  moveItem(sourcePath, targetPath);
  target.classList.remove('drag-over');
}

// ==================== 事件监听 ====================

fileTree.addEventListener('click', (e) => {
  if (e.target.classList.contains('tree-delete')) {
    e.stopPropagation();
    const item = e.target.closest('.tree-item');
    if (item) {
      deleteFile(item.dataset.path, e);
    }
    return;
  }

  if (e.target.classList.contains('tree-rename')) {
    e.stopPropagation();
    const item = e.target.closest('.tree-item');
    if (item) {
      const type = item.dataset.type;
      renameItem(item.dataset.path, type, e);
    }
    return;
  }

  const item = e.target.closest('.tree-item');
  if (item && item.dataset.type === 'file') {
    openFile(item.dataset.path);
  }
});

document.getElementById('newFileBtn').addEventListener('click', () => {
  newFileDialog.showModal();
});

document.getElementById('newFolderBtn').addEventListener('click', () => newFolderDialog.showModal());

document.getElementById('refreshBtn').addEventListener('click', loadFiles);

document.getElementById('saveBtn').addEventListener('click', saveFile);

document.getElementById('deployBtn').addEventListener('click', deploy);

document.getElementById('toggleChanges').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleChanges();
});

modifiedIndicator.addEventListener('click', (e) => {
  if (e.target === modifiedIndicator || e.target.closest('.modified-summary')) {
    toggleChanges();
  }
});

document.getElementById('previewToggle').addEventListener('click', togglePreview);

document.getElementById('cancelNewFile').addEventListener('click', () => {
  newFileDialog.close();
  newFileNameInput.value = '';
});

newFileDialog.addEventListener('submit', (e) => {
  e.preventDefault();
  createFile();
});

renameDialog.addEventListener('submit', (e) => {
  e.preventDefault();
  renameItemConfirm();
});

document.getElementById('cancelRename').addEventListener('click', () => {
  renameDialog.close();
});

newFolderDialog.addEventListener('submit', (e) => {
  e.preventDefault();
  createFolderConfirm();
});

document.getElementById('cancelNewFolder').addEventListener('click', () => {
  newFolderDialog.close();
  newFolderNameInput.value = '';
});

apiInfoBtn.addEventListener('click', () => {
  apiInfo.style.display = apiInfo.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('cancelUpload').addEventListener('click', () => {
  uploadDialog.close();
});

confirmUploadBtn.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');

  if (e.dataTransfer.files.length > 0) {
    uploadFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    uploadFiles(e.target.files);
  }
});

editor.addEventListener('input', updatePreview);

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
});

// 上传按钮事件
document.getElementById('uploadBtn').addEventListener('click', () => {
  uploadDialog.showModal();
});

// 将函数暴露到全局作用域
window.openFile = openFile;
window.deleteFile = deleteFile;
window.renameItem = renameItem;
window.copyText = copyText;
window.toast = toast;

// 初始化
loadFiles();
