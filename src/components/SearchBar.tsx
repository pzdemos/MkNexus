import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  name: string;
  path: string;
}

interface SearchBarProps {
  onSearch: (query: string) => SearchResult[];
  onSelect: (path: string) => void;
}

export function SearchBar({ onSearch, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim()) {
        const searchResults = onSearch(value);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    },
    [onSearch]
  );

  const handleSelect = useCallback(
    (path: string) => {
      onSelect(path);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex].path);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder="搜索文档..."
          className={cn(
            'w-full h-9 pl-9 pr-16 text-sm bg-muted/50 border border-border/50 rounded-lg',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
            'transition-all'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border/50">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="py-1.5">
            {results.map((result, index) => (
              <button
                key={result.path}
                onClick={() => handleSelect(result.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent/50'
                )}
              >
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{result.name}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {result.path}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <span className="font-medium">↑↓</span> 选择
            <span className="mx-2">·</span>
            <span className="font-medium">Enter</span> 打开
            <span className="mx-2">·</span>
            <span className="font-medium">Esc</span> 关闭
          </div>
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">未找到相关文档</p>
        </div>
      )}
    </div>
  );
}
