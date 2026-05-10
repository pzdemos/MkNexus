import { useNavigate } from 'react-router';
import { FileText, Folder, FolderOpen, BookOpen, ArrowRight, Layers } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const navigate = useNavigate();
  const { documents } = useDocuments();

  // Flatten all files
  const allFiles: Array<{ name: string; path: string; title: string; dir: string }> = [];
  const collectFiles = (
    nodes: Array<{ name: string; path: string; isFile: boolean; content?: string; children?: typeof nodes }>,
    dir: string
  ) => {
    for (const node of nodes) {
      if (node.isFile && node.content) {
        const titleMatch = node.content.match(/^#\s+(.+)$/m);
        allFiles.push({
          name: node.name,
          path: node.path,
          title: titleMatch ? titleMatch[1].trim() : node.name,
          dir,
        });
      }
      if (node.children) {
        collectFiles(node.children, node.isFile ? dir : node.name);
      }
    }
  };
  collectFiles(documents, '');

  // Group by directory
  const groups: Array<{ name: string; files: typeof allFiles }> = [];
  const rootFiles = allFiles.filter((f) => !f.dir);
  if (rootFiles.length > 0) {
    groups.push({ name: '根目录', files: rootFiles });
  }
  const dirNames = [...new Set(allFiles.filter((f) => f.dir).map((f) => f.dir))];
  for (const dir of dirNames) {
    groups.push({
      name: dir,
      files: allFiles.filter((f) => f.dir === dir),
    });
  }

  const docCount = allFiles.length;
  const dirCount = groups.length;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5 overflow-hidden">
          <img src="/logo.png" alt="MkNexus" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          MkNexus
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-6">
          Markdown 文档的智能化枢纽，轻松管理、实时预览、优雅阅读
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            {docCount} 个文档
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
            <Layers className="w-3.5 h-3.5" />
            {dirCount} 个分组
          </span>
        </div>
      </div>

      {/* Document Groups */}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.name}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 px-1">
              {group.name === '根目录' ? (
                <FolderOpen className="w-4 h-4 text-primary" />
              ) : (
                <Folder className="w-4 h-4 text-primary" />
              )}
              {group.name}
              <span className="text-xs text-muted-foreground font-normal">
                ({group.files.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => navigate(`/doc/${encodeURIComponent(file.path)}`)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card',
                    'hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm',
                    'transition-all duration-200 text-left group'
                  )}
                >
                  <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <FileText className="w-4.5 h-4.5 text-primary/70 group-hover:text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {file.title || file.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {file.path}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 self-center transition-colors" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {allFiles.length === 0 && (
        <div className="text-center py-20">
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
      )}
    </div>
  );
}
