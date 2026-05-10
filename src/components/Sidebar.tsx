import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import type { DocNode } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';

// Logo component
function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="MkNexus"
      className={cn('object-contain', className)}
      draggable={false}
    />
  );
}

interface SidebarProps {
  documents: DocNode[];
  activePath: string;
  onSelect: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function DocTreeItem({
  node,
  activePath,
  onSelect,
  level = 0,
}: {
  node: DocNode;
  activePath: string;
  onSelect: (path: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = node.path === activePath;
  const hasChildren = node.children && node.children.length > 0;

  if (node.isFile) {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left',
          'hover:bg-accent',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <FileText className="w-4 h-4 shrink-0 opacity-60" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left',
          'hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <span className="shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <span className="shrink-0">
          {expanded ? (
            <FolderOpen className="w-4 h-4 opacity-60" />
          ) : (
            <Folder className="w-4 h-4 opacity-60" />
          )}
        </span>
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <DocTreeItem
              key={child.path}
              node={child}
              activePath={activePath}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ documents, activePath, onSelect, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              <Logo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-tight">MkNexus</h1>
              <p className="text-xs text-muted-foreground">Markdown Docs Hub</p>
            </div>
          </div>
        </div>

        {/* Document Tree */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {documents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>暂无文档</p>
              <p className="text-xs mt-1">在 src/docs/ 目录下添加 .md 文件</p>
            </div>
          ) : (
            documents.map((doc) => (
              <DocTreeItem
                key={doc.path}
                node={doc}
                activePath={activePath}
                onSelect={onSelect}
              />
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
          将 .md 文件放入 src/docs/ 目录即可自动加载
        </div>
      </aside>
    </>
  );
}
