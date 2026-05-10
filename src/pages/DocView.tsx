import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TableOfContents } from '@/components/TableOfContents';
import { cn } from '@/lib/utils';

// Build breadcrumb segments from path, each navigable
function buildBreadcrumbSegments(path: string): Array<{ label: string; path: string }> {
  const parts = path.split('/');
  const segments: Array<{ label: string; path: string }> = [];

  for (let i = 0; i < parts.length; i++) {
    const label = parts[i]
      .replace(/^\d+[-_]/, '')
      .replace(/\.md$/i, '')
      .replace(/[-_]/g, ' ');
    // For intermediate directories, path leads to the first doc in that dir
    const partialPath = parts.slice(0, i + 1).join('/');
    segments.push({ label, path: partialPath });
  }

  return segments;
}

// Check if a path is a directory (has children) or a file
function isDirectory(docNodes: Array<any>, targetPath: string): boolean {
  const findNode = (nodes: Array<any>): any => {
    for (const node of nodes) {
      if (node.path === targetPath) return node;
      if (node.children) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  const node = findNode(docNodes);
  return node ? !node.isFile : false;
}

// Find the first document under a given path
function findFirstDoc(docNodes: Array<any>, targetPath: string): string | null {
  const findNode = (nodes: Array<any>): any => {
    for (const node of nodes) {
      if (node.path === targetPath) return node;
      if (node.children) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const node = findNode(docNodes);
  if (!node) return null;
  if (node.isFile) return node.path;
  if (node.children) {
    for (const child of node.children) {
      if (child.isFile) return child.path;
      const deep = findFirstDoc(docNodes, child.path);
      if (deep) return deep;
    }
  }
  return null;
}

export default function DocView() {
  const navigate = useNavigate();
  const params = useParams();
  const { documents, getDocument } = useDocuments();

  // Get doc path from wildcard param
  const rawPath = params['*'] || '';
  const docPath = useMemo(() => decodeURIComponent(rawPath), [rawPath]);

  const [currentDoc, setCurrentDoc] = useState<{ name: string; content: string; path: string } | null>(null);

  // Load document content
  useEffect(() => {
    if (!docPath) return;

    // If the path points to a directory, redirect to the first doc in it
    if (isDirectory(documents, docPath)) {
      const firstDoc = findFirstDoc(documents, docPath);
      if (firstDoc && firstDoc !== docPath) {
        navigate(`/doc/${encodeURIComponent(firstDoc)}`, { replace: true });
        return;
      }
    }

    const doc = getDocument(docPath);
    if (doc) {
      setCurrentDoc({ ...doc, path: docPath });
    } else {
      setCurrentDoc(null);
    }
  }, [docPath, documents, getDocument, navigate]);

  // Extract title from markdown content
  const extractTitle = (content: string): string => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  };

  // Build clickable breadcrumb
  const breadcrumbSegments = useMemo(() => buildBreadcrumbSegments(docPath), [docPath]);

  // Determine if a breadcrumb segment is clickable (it's a directory that contains docs)
  const isSegmentClickable = (segmentPath: string, index: number): boolean => {
    // Last segment is the current doc itself, don't make it a link
    if (index === breadcrumbSegments.length - 1) return false;
    // Check if it's a directory with docs inside
    return isDirectory(documents, segmentPath);
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (segmentPath: string) => {
    if (isDirectory(documents, segmentPath)) {
      const firstDoc = findFirstDoc(documents, segmentPath);
      if (firstDoc) {
        navigate(`/doc/${encodeURIComponent(firstDoc)}`);
      }
    } else {
      navigate(`/doc/${encodeURIComponent(segmentPath)}`);
    }
  };

  if (!currentDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">文档未找到</h2>
          <p className="text-sm text-muted-foreground mb-4">
            路径 &quot;{docPath}&quot; 不存在
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex gap-8 px-6 lg:px-10 py-8">
      <article className="flex-1 min-w-0">
        {/* Clickable Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link
                to="/"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                首页
              </Link>
            </li>
            {breadcrumbSegments.map((segment, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                {isSegmentClickable(segment.path, index) ? (
                  <button
                    onClick={() => handleBreadcrumbClick(segment.path)}
                    className={cn(
                      'hover:text-primary transition-colors truncate max-w-[200px]',
                      index === breadcrumbSegments.length - 1
                        ? 'text-foreground font-medium cursor-default hover:text-foreground'
                        : 'hover:underline underline-offset-2'
                    )}
                    disabled={index === breadcrumbSegments.length - 1}
                  >
                    {segment.label}
                  </button>
                ) : (
                  <span
                    className={cn(
                      'truncate max-w-[200px]',
                      index === breadcrumbSegments.length - 1
                        ? 'text-foreground font-medium'
                        : ''
                    )}
                  >
                    {segment.label}
                  </span>
                )}
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
  );
}
