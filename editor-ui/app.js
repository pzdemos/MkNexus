// ==================== Markdown Parser (内联，避免外部依赖) ====================
const Markdown = {
  parse(text) {
    if (!text) return '';

    // 转义 HTML
    const html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (must be first)
    let result = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    result = result.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    result = result.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    result = result.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and Italic
    result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Images
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Blockquotes
    result = result.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    result = result.replace(/^\* (.+)$/gm, '<li>$1</li>');
    result = result.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    result = result.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Horizontal rules
    result = result.replace(/^---$/gm, '<hr>');

    // Line breaks and paragraphs
    result = result.replace(/\n\n+/g, '</p><p>');
    result = '<p>' + result + '</p>';

    // Clean up empty paragraphs
    result = result.replace(/<p>(<\/p>|<h[1-6]>)/g, '$1');
    result = result.replace(/(<\/h[1-6]>|<\/pre>|<\/ul>|<\/ol>|<hr>)<\/p>/g, '$1');
    result = result.replace(/<p><\/p>/g, '');

    return result;
  },

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

// ==================== API 配置 ====================
const API = window.location.pathname.startsWith('/editor') ? '/editor' : '';

// ==================== 状态管理 ====================
const state = {
  files: [],
  currentFile: null,
  currentDir: '',
  isPreviewMode: false,
  modified: [],
  changes: []
};

// ==================== DOM 元素 ====================
const dom = {
  fileTree: document.getElementById('fileTree'),
  editor: document.getElementById('editor'),
  preview: document.getElementById('preview'),
  previewPane: document.getElementById('previewPane'),
  fileStatus: document.getElementById('fileStatus'),
  saveBtn: document.getElementById('saveBtn'),
  toastContainer: document.getElementById('toastContainer'),
  newFileDialog: document.getElementById('newFileDialog'),
  newFolderDialog: document.getElementById('newFolderDialog'),
  renameDialog: document.getElementById('renameDialog'),
  deleteDialog: document.getElementById('deleteDialog'),
  modifiedIndicator: document.getElementById('modifiedIndicator'),
  deployBtn: document.getElementById('deployBtn')
};

// ==================== 工具函数 ====================
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  dom.toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showLoading() {
  dom.fileTree.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

// ==================== API 调用 ====================
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(`${API}${url}`, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    toast(error.message, 'error');
    throw error;
  }
}

// ==================== 文件操作 ====================
async function loadFiles() {
  showLoading();
  try {
    const data = await apiFetch('/api/files');
    state.files = data.files || [];
    state.modified = data.modified || [];
    state.changes = data.changes || [];
    renderFileTree();
    updateModifiedIndicator();
  } catch (error) {
    dom.fileTree.innerHTML = '<div class="empty-state">加载失败</div>';
  }
}

function updateModifiedIndicator() {
  if (state.modified.length > 0) {
    dom.modifiedIndicator.style.display = 'flex';
    dom.modifiedIndicator.querySelector('.modified-count').textContent = state.modified.length;
  } else {
    dom.modifiedIndicator.style.display = 'none';
  }
}

function renderFileTree(items = state.files, level = 0) {
  if (!items.length) {
    dom.fileTree.innerHTML = '<div class="empty-state">暂无文件</div>';
    return;
  }

  const html = items.map(item => {
    const isActive = state.currentFile === item.path;
    const isModified = state.modified.includes(item.path);
    const indent = level * 16;

    if (item.isDirectory) {
      return `
        <div class="tree-item tree-folder" style="padding-left: ${8 + indent}px" data-path="${item.path}" data-type="folder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="tree-name">${item.name}</span>
        </div>
        ${item.children ? `<div class="tree-children">${renderFileTreeItems(item.children, level + 1)}</div>` : ''}
      `;
    } else {
      return `
        <div class="tree-item ${isActive ? 'active' : ''} ${isModified ? 'modified' : ''}" style="padding-left: ${8 + indent}px" data-path="${item.path}" data-type="file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <span class="tree-name">${item.name}</span>
          ${isModified ? '<span class="modified-dot"></span>' : ''}
          <div class="tree-actions">
            <button class="btn-delete" data-path="${item.path}" title="删除">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }
  }).join('');

  dom.fileTree.innerHTML = html;
  attachTreeEvents();
}

function renderFileTreeItems(items, level) {
  return items.map(item => {
    const isActive = state.currentFile === item.path;
    const isModified = state.modified.includes(item.path);
    const indent = level * 16;
    if (item.isDirectory) {
      return `
        <div class="tree-item tree-folder" style="padding-left: ${8 + indent}px" data-path="${item.path}" data-type="folder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="tree-name">${item.name}</span>
        </div>
        ${item.children ? `<div class="tree-children">${renderFileTreeItems(item.children, level + 1)}</div>` : ''}
      `;
    } else {
      return `
        <div class="tree-item ${isActive ? 'active' : ''} ${isModified ? 'modified' : ''}" style="padding-left: ${8 + indent}px" data-path="${item.path}" data-type="file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <span class="tree-name">${item.name}</span>
          ${isModified ? '<span class="modified-dot"></span>' : ''}
          <div class="tree-actions">
            <button class="btn-delete" data-path="${item.path}" title="删除">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }
  }).join('');
}

function attachTreeEvents() {
  dom.fileTree.querySelectorAll('.tree-item[data-type="file"]').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-delete')) {
        openFile(item.dataset.path);
      }
    });
  });

  dom.fileTree.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteDialog(btn.dataset.path);
    });
  });
}

async function openFile(path) {
  state.currentFile = path;
  state.currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';

  try {
    const data = await apiFetch(`/api/file/${encodeURIComponent(path)}`);
    dom.editor.value = data.content || '';
    dom.fileStatus.textContent = path;
    dom.fileStatus.classList.remove('modified');
    dom.saveBtn.disabled = false;

    updatePreview();
    renderFileTree();
  } catch (error) {
    toast('打开文件失败', 'error');
  }
}

async function saveFile() {
  if (!state.currentFile) return;

  try {
    await apiFetch(`/api/file/${encodeURIComponent(state.currentFile)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: dom.editor.value })
    });

    dom.fileStatus.textContent = state.currentFile;
    dom.fileStatus.classList.remove('modified');

    // 重新加载文件列表以更新 modified 状态
    await loadFiles();
    toast('已保存', 'success');
  } catch (error) {
    toast('保存失败', 'error');
  }
}

async function deleteFile(path) {
  try {
    await apiFetch(`/api/file/${encodeURIComponent(path)}`, { method: 'DELETE' });

    if (state.currentFile === path) {
      state.currentFile = null;
      dom.editor.value = '';
      dom.fileStatus.textContent = '未选择文件';
      dom.saveBtn.disabled = true;
    }

    dom.deleteDialog.close();
    await loadFiles();
    toast('已删除', 'success');
  } catch (error) {
    toast('删除失败', 'error');
  }
}

async function createFile() {
  const name = document.getElementById('newFileName').value.trim();
  if (!name) return;

  if (!name.endsWith('.md')) {
    toast('文件名必须以 .md 结尾', 'error');
    return;
  }

  try {
    const data = await apiFetch(`/api/new/${encodeURIComponent(state.currentDir)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    dom.newFileDialog.close();
    document.getElementById('newFileName').value = '';
    await loadFiles();
    openFile(data.path);
  } catch (error) {
    toast('创建失败', 'error');
  }
}

async function createFolder() {
  const name = document.getElementById('newFolderName').value.trim();
  if (!name) return;

  try {
    await apiFetch(`/api/folder/${encodeURIComponent(state.currentDir)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    dom.newFolderDialog.close();
    document.getElementById('newFolderName').value = '';
    await loadFiles();
    toast('目录已创建', 'success');
  } catch (error) {
    toast('创建失败', 'error');
  }
}

async function deploy() {
  if (state.modified.length === 0) {
    toast('没有需要部署的文件', 'info');
    return;
  }

  const confirmed = confirm(`确定要部署 ${state.modified.length} 个文件吗？`);
  if (!confirmed) return;

  try {
    const data = await apiFetch('/api/deploy', { method: 'POST' });
    if (data.success) {
      await loadFiles();
      toast(data.message || '部署成功', 'success');
    }
  } catch (error) {
    toast('部署失败: ' + error.message, 'error');
  }
}

// ==================== 预览功能 ====================
function updatePreview() {
  dom.preview.innerHTML = Markdown.parse(dom.editor.value);
}

function togglePreview() {
  state.isPreviewMode = !state.isPreviewMode;

  if (state.isPreviewMode) {
    dom.previewPane.style.display = 'block';
    dom.editor.parentElement.style.display = 'none';
    document.getElementById('previewToggle').textContent = '编辑';
    updatePreview();
  } else {
    dom.previewPane.style.display = 'none';
    dom.editor.parentElement.style.display = 'block';
    document.getElementById('previewToggle').textContent = '预览';
  }
}

// ==================== 对话框 ====================
function showDeleteDialog(path) {
  document.getElementById('deleteMessage').textContent = `确定要删除 ${path} 吗？`;
  dom.deleteDialog.dataset.path = path;
  dom.deleteDialog.showModal();
}

// ==================== 事件监听 ====================
dom.editor.addEventListener('input', () => {
  if (state.currentFile) {
    dom.fileStatus.textContent = `${state.currentFile} *`;
    dom.fileStatus.classList.add('modified');
  }
  if (state.isPreviewMode) {
    updatePreview();
  }
});

document.getElementById('newFileBtn').addEventListener('click', () => {
  dom.newFileDialog.showModal();
});

document.getElementById('newFolderBtn').addEventListener('click', () => {
  dom.newFolderDialog.showModal();
});

document.getElementById('refreshBtn').addEventListener('click', loadFiles);

document.getElementById('saveBtn').addEventListener('click', saveFile);

dom.deployBtn.addEventListener('click', deploy);

document.getElementById('previewToggle').addEventListener('click', togglePreview);

document.getElementById('cancelNewFile').addEventListener('click', () => {
  dom.newFileDialog.close();
  document.getElementById('newFileName').value = '';
});

document.getElementById('cancelNewFolder').addEventListener('click', () => {
  dom.newFolderDialog.close();
  document.getElementById('newFolderName').value = '';
});

document.getElementById('cancelRename').addEventListener('click', () => {
  dom.renameDialog.close();
});

document.getElementById('cancelDelete').addEventListener('click', () => {
  dom.deleteDialog.close();
});

document.getElementById('confirmDelete').addEventListener('click', () => {
  if (dom.deleteDialog.dataset.path) {
    deleteFile(dom.deleteDialog.dataset.path);
  }
});

dom.newFileDialog.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  createFile();
});

dom.newFolderDialog.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  createFolder();
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
  if (e.key === 'Escape') {
    dom.newFileDialog.close();
    dom.newFolderDialog.close();
    dom.renameDialog.close();
    dom.deleteDialog.close();
  }
});

// ==================== 初始化 ====================
loadFiles();
