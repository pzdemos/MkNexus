import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Menu, RefreshCw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, loading, error, reload, hasUpdate, dismissUpdate, applyUpdate, searchDocuments } = useDocuments();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const toastShownRef = useRef<Set<string>>(new Set());

  // Get active doc path from URL
  const getActivePath = useCallback(() => {
    const match = location.pathname.match(/^\/doc\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : '';
  }, [location.pathname]);

  const activePath = getActivePath();

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

  // WebSocket for LiveReload
  useEffect(() => {
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
              setTimeout(() => window.location.reload(), 500);
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

  const handleSelect = useCallback((path: string) => {
    navigate(`/doc/${encodeURIComponent(path)}`);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

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

  const handleSearchSelect = useCallback(
    (path: string) => {
      handleSelect(path);
      toast.success('已打开文档', { duration: 1500 });
    },
    [handleSelect]
  );

  const handleReload = useCallback(async () => {
    const toastId = toast.loading('正在刷新文档...', { duration: 30000 });
    await reload();
    toast.dismiss(toastId);
    toast.success('文档已刷新', {
      description: '已加载最新内容',
      duration: 2000,
    });
  }, [reload]);

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
      <Sidebar
        documents={documents}
        activePath={activePath}
        onSelect={handleSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
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

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function countFiles(nodes: Array<{ isFile: boolean; children?: typeof nodes }>): number {
  let count = 0;
  for (const node of nodes) {
    if (node.isFile) count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}
