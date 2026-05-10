import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, RefreshCw, BookOpen, ChevronRight, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';
import { Sidebar } from '@/components/Sidebar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { SearchBar } from '@/components/SearchBar';
import { TableOfContents } from '@/components/TableOfContents';
import { cn } from '@/lib/utils';

export default function Home() {
  const { documents, loading, error, reload, hasUpdate, dismissUpdate, applyUpdate, searchDocuments, getDocument } = useDocuments();
  const [activePath, setActivePath] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<{ name: string; content: string } | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const toastShownRef = useRef<Set<string>>(new Set());

  // Set initial active document
  useEffect(() => {
    if (documents.length > 0 && !activePath) {
      const findFirstFile = (nodes: typeof documents): string | null => {
        for (const node of nodes) {
          if (node.isFile) return node.path;
          if (node.children) {
            const found = findFirstFile(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const firstPath = findFirstFile(documents);
      if (firstPath) setActivePath(firstPath);
    }
  }, [documents, activePath]);

  // Load document content when activePath changes
  useEffect(() => {
    if (activePath) {
      const doc = getDocument(activePath);
      if (doc) {
        setCurrentDoc(doc);
        setSidebarOpen(false);
      }
    }
  }, [activePath, getDocument]);

  // Toast: initial load complete
  useEffect(() => {
    if (!loading && documents.length > 0 && !toastShownRef.current.has('loaded')) {
      toastShownRef.current.add('loaded');
      const docCount = countFiles(documents);
      toast.success('文档加载完成', {
        description: `共发现 ${docCount} 个文档`,
        duration: 2000,
      });
    }
  }, [loading, documents]);

  // Toast: load error
  useEffect(() => {
    if (error) {
      toast.error('文档加载失败', {
        description: error.message,
        duration: 5000,
      });
    }
  }, [error]);

  // Toast: update detected
  useEffect(() => {
    if (hasUpdate) {
      toast.info('检测到文档更新', {
        description: '点击"立即刷新"查看最新内容',
        duration: 8000,
        action: {
          label: '刷新',
          onClick: () => applyUpdate(),
        },
      });
    }
  }, [hasUpdate, applyUpdate]);

  // WebSocket for LiveReload notifications (from watch-and-build)
  useEffect(() => {
    // Only connect in production mode where watch-and-build might be running
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host + '/__ws';

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let connectCount = 0;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          connectCount = 0;
          setWsConnected(true);
          if (!toastShownRef.current.has('ws-connected')) {
            toastShownRef.current.add('ws-connected');
            toast.success('实时更新已连接', {
              description: '文档修改后将自动刷新',
              duration: 2000,
            });
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'reload') {
              toast.success('文档已更新', {
                description: '正在刷新页面...',
                duration: 2000,
              });
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
            if (msg.type === 'building') {
              toast.loading('正在重新构建文档...', {
                description: '请稍候',
                duration: 30000,
                id: 'building-toast',
              });
            }
          } catch (e) { /* ignore */ }
        };

        ws.onclose = () => {
          setWsConnected(false);
          ws = null;
          connectCount++;
          const delay = Math.min(connectCount * 2000, 15000);
          reconnectTimer = setTimeout(connect, delay);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        // WebSocket not available
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Handle document selection
  const handleSelect = useCallback((path: string) => {
    setActivePath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const results = searchDocuments(query);
      if (results.length === 0 && query.trim()) {
        toast.info('未找到相关文档', {
          description: `搜索 "${query}" 没有结果`,
          duration: 3000,
        });
      }
      return results;
    },
    [searchDocuments]
  );

  // Handle search select
  const handleSearchSelect = useCallback(
    (path: string) => {
      handleSelect(path);
      toast.success('已打开文档', { duration: 1500 });
    },
    [handleSelect]
  );

  // Handle manual reload with toast
  const handleReload = useCallback(async () => {
    const toastId = toast.loading('正在刷新文档...', { duration: 30000 });
    await reload();
    toast.dismiss(toastId);
    toast.success('文档已刷新', {
      description: '已加载最新内容',
      duration: 2000,
    });
  }, [reload]);

  // Extract title from markdown content
  const extractTitle = (content: string): string => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  };

  // Build breadcrumb from path
  const buildBreadcrumb = (path: string) => {
    const parts = path.split('/');
    return parts.map((part) =>
      part
        .replace(/^\d+[-_]/, '')
        .replace(/\.md$/i, '')
        .replace(/[-_]/g, ' ')
    );
  };

  // Count total files in document tree
  const countFiles = (nodes: typeof documents): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.isFile) count++;
      if (node.children) count += countFiles(node.children);
    }
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载文档...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/logo.png" alt="MkNexus" className="w-10 h-10 object-contain opacity-50" />
          </div>
          <h2 className="text-lg font-semibold mb-2">加载失败</h2>
          <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        activePath={activePath}
        onSelect={handleSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="shrink-0 h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <SearchBar onSearch={handleSearch} onSelect={handleSearchSelect} />
          </div>

          {/* WebSocket status indicator */}
          {wsConnected && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200"
              title="实时更新已连接"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-700">实时</span>
            </div>
          )}

          <button
            onClick={handleReload}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title="刷新文档"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        {/* Update Notification Bar */}
        {hasUpdate && (
          <div className="shrink-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary/90">文档内容已更新</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyUpdate}
                  className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  立即刷新
                </button>
                <button
                  onClick={dismissUpdate}
                  className="p-1 rounded hover:bg-primary/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {currentDoc ? (
            <div className="max-w-6xl mx-auto flex gap-8 px-6 lg:px-10 py-8">
              {/* Document Content */}
              <article className="flex-1 min-w-0">
                {/* Breadcrumb */}
                <nav className="mb-6">
                  <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <li>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        文档
                      </span>
                    </li>
                    {buildBreadcrumb(activePath).map((part, index, arr) => (
                      <li key={index} className="flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        <span
                          className={cn(
                            index === arr.length - 1
                              ? 'text-foreground font-medium'
                              : ''
                          )}
                        >
                          {part}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* Document Title */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {extractTitle(currentDoc.content) || currentDoc.name}
                  </h1>
                </div>

                {/* Markdown Content */}
                <MarkdownRenderer content={currentDoc.content} />

                {/* Document Footer */}
                <div className="mt-16 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    文档内容如有更新，刷新页面即可查看最新版本
                  </p>
                </div>
              </article>

              {/* Table of Contents - Right Sidebar */}
              <TableOfContents content={currentDoc.content} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6 overflow-hidden">
                  <img src="/logo.png" alt="MkNexus" className="w-12 h-12 object-contain opacity-40" />
                </div>
                <h2 className="text-lg font-semibold mb-2">暂无文档</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  在项目的 src/docs/ 目录下创建 Markdown 文件，刷新页面后即可在这里查看
                </p>
                <div className="bg-muted rounded-lg p-4 text-left text-sm font-mono text-muted-foreground max-w-sm mx-auto">
                  <p className="text-muted-foreground/60 mb-2"># 示例命令</p>
                  <p>mkdir -p src/docs</p>
                  <p>{`echo "# 我的文档" > src/docs/intro.md`}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
