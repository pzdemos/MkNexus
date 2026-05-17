// 调试脚本
console.log('Debug script loaded');

// 测试删除功能
window.testDelete = function() {
  const deleteBtn = document.querySelector('.tree-delete');
  console.log('Delete button found:', deleteBtn);
  
  if (deleteBtn) {
    console.log('Delete button classes:', deleteBtn.className);
    console.log('Parent item:', deleteBtn.closest('.tree-item'));
    
    // 模拟点击
    deleteBtn.click();
  }
};

// 检查事件监听器
window.checkListeners = function() {
  const fileTree = document.getElementById('fileTree');
  console.log('File tree element:', fileTree);
  console.log('File tree listeners:', getEventListeners ? getEventListeners(fileTree) : 'Not available');
};
