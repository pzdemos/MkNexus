import { useState, useEffect, useCallback, useRef } from 'react';

export interface DocNode {
  name: string;
  path: string;
  isFile: boolean;
  content?: string;
  children?: DocNode[];
}

// Content hash for detecting changes
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function buildDocTree(files: Array<{ path: string; content: string }>): DocNode[] {
  const root: DocNode[] = [];
  const pathMap = new Map<string, DocNode>();

  const sortedFiles = [...files].sort((a, b) => {
    const aParts = a.path.split('/');
    const bParts = b.path.split('/');
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aIsFile = i === aParts.length - 1;
      const bIsFile = i === bParts.length - 1;
      if (aIsFile && !bIsFile) return 1;
      if (!aIsFile && bIsFile) return -1;
      const cmp = aParts[i].localeCompare(bParts[i], undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    }
    return aParts.length - bParts.length;
  });

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isLast) {
        const displayName = part
          .replace(/^\d+[-_]/, '')
          .replace(/\.md$/i, '')
          .replace(/[-_]/g, ' ');
        currentLevel.push({
          name: displayName,
          path: file.path,
          isFile: true,
          content: file.content,
        });
      } else {
        let node = pathMap.get(currentPath);
        if (!node) {
          const displayName = part
            .replace(/^\d+[-_]/, '')
            .replace(/[-_]/g, ' ');
          node = {
            name: displayName,
            path: currentPath,
            isFile: false,
            children: [],
          };
          pathMap.set(currentPath, node);
          currentLevel.push(node);
        }
        currentLevel = node.children!;
      }
    }
  }

  return root;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const contentHashesRef = useRef<Map<string, string>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDocuments = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const modules = import.meta.glob('/src/docs/**/*.md', {
        query: '?raw',
        import: 'default',
        eager: false,
      });

      const files: Array<{ path: string; content: string }> = [];
      const newHashes = new Map<string, string>();

      for (const [fullPath, loader] of Object.entries(modules)) {
        try {
          const content = await loader() as string;
          const relativePath = fullPath.replace(/^\/src\/docs\//, '');
          files.push({ path: relativePath, content });
          newHashes.set(relativePath, simpleHash(content));
        } catch (err) {
          console.warn(`Failed to load document: ${fullPath}`, err);
        }
      }

      // Detect content changes
      const oldHashes = contentHashesRef.current;
      let changed = false;

      // Check for new files
      for (const [path, hash] of newHashes) {
        if (!oldHashes.has(path)) {
          changed = true;
          break;
        }
        if (oldHashes.get(path) !== hash) {
          changed = true;
          break;
        }
      }

      // Check for deleted files
      if (!changed) {
        for (const path of oldHashes.keys()) {
          if (!newHashes.has(path)) {
            changed = true;
            break;
          }
        }
      }

      contentHashesRef.current = newHashes;

      if (changed && !loading && documents.length > 0) {
        setHasUpdate(true);
      }

      const tree = buildDocTree(files);
      setDocuments(tree);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load documents'));
      console.error('Error loading documents:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [loading, documents.length]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Polling for content changes (every 5 seconds)
  // In dev mode with Vite HMR, this isn't needed.
  // In production, this detects when a new build is deployed.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (import.meta.env.PROD) {
        loadDocuments(true);
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadDocuments]);

  // Clear update notification
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  // Apply update (reload page to get new build)
  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  const getAllFiles = useCallback((nodes: DocNode[]): Array<{ name: string; path: string; content: string }> => {
    const result: Array<{ name: string; path: string; content: string }> = [];
    const traverse = (nodeList: DocNode[]) => {
      for (const node of nodeList) {
        if (node.isFile && node.content) {
          result.push({ name: node.name, path: node.path, content: node.content });
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return result;
  }, []);

  const getDocument = useCallback((path: string): { name: string; content: string } | null => {
    const allFiles = getAllFiles(documents);
    const found = allFiles.find(f => f.path === path);
    if (found) {
      return { name: found.name, content: found.content };
    }
    return null;
  }, [documents, getAllFiles]);

  const searchDocuments = useCallback((query: string): Array<{ name: string; path: string }> => {
    if (!query.trim()) return [];
    const allFiles = getAllFiles(documents);
    const lowerQuery = query.toLowerCase();
    return allFiles
      .filter(f => {
        const title = extractTitle(f.content);
        return f.name.toLowerCase().includes(lowerQuery) ||
               title.toLowerCase().includes(lowerQuery) ||
               f.content.toLowerCase().includes(lowerQuery);
      })
      .map(f => ({
        name: extractTitle(f.content) || f.name,
        path: f.path,
      }));
  }, [documents, getAllFiles]);

  return {
    documents,
    loading,
    error,
    hasUpdate,
    reload: loadDocuments,
    dismissUpdate,
    applyUpdate,
    getDocument,
    searchDocuments,
    allFiles: getAllFiles(documents),
  };
}
