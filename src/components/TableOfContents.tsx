import { useState, useEffect, useCallback } from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function extractHeadings(content: string): TocItem[] {
  const lines = content.split('\n');
  const headings: TocItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[#*`\[\]\(\)]/g, '');
      const id = text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');

  useEffect(() => {
    const extracted = extractHeadings(content);
    // Filter only h2 and h3 for cleaner TOC
    setHeadings(extracted.filter((h) => h.level >= 2 && h.level <= 3));
  }, [content]);

  // Use IntersectionObserver to track active heading
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Pick the first visible heading
          setActiveHeading(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    // Observe all heading elements in the document
    const headingElements = document.querySelectorAll('.markdown-body h2, .markdown-body h3');
    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings, content]);

  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-20">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-foreground">
          <List className="w-4 h-4" />
          <span>目录</span>
        </div>
        <nav className="border-l border-border/60 pl-3">
          <ul className="space-y-1">
            {headings.map((heading) => (
              <li key={`${heading.level}-${heading.id}`}>
                <button
                  onClick={() => handleClick(heading.id)}
                  className={cn(
                    'w-full text-left text-sm leading-relaxed py-1 rounded transition-all',
                    'hover:text-foreground',
                    heading.level === 3 && 'pl-3',
                    activeHeading === heading.id
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
