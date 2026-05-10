import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom renderer for code blocks with syntax highlighting
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (!inline && language) {
    return (
      <SyntaxHighlighter
        style={oneLight}
        language={language}
        PreTag="div"
        className="rounded-lg my-4 text-sm leading-relaxed !bg-muted/50 !border !border-border"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }

  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono',
        'text-foreground/90 border border-border/50',
        inline ? 'mx-0.5' : 'block p-4 my-4 overflow-x-auto'
      )}
      {...props}
    >
      {children}
    </code>
  );
};

// Custom heading components
const H1 = ({ children, ...props }: any) => (
  <h1 className="text-3xl mt-2 mb-6 pb-4 border-b border-border font-semibold tracking-tight text-foreground scroll-mt-24" {...props}>
    {children}
  </h1>
);

const H2 = ({ children, ...props }: any) => (
  <h2 className="text-2xl mt-10 mb-4 pb-2 border-b border-border/60 font-semibold tracking-tight text-foreground scroll-mt-24" {...props}>
    {children}
  </h2>
);

const H3 = ({ children, ...props }: any) => (
  <h3 className="text-xl mt-8 mb-3 font-semibold tracking-tight text-foreground scroll-mt-24" {...props}>
    {children}
  </h3>
);

const H4 = ({ children, ...props }: any) => (
  <h4 className="text-lg mt-6 mb-2 font-semibold tracking-tight text-foreground scroll-mt-24" {...props}>
    {children}
  </h4>
);

const H5 = ({ children, ...props }: any) => (
  <h5 className="text-base mt-4 mb-2 font-semibold tracking-tight text-foreground scroll-mt-24" {...props}>
    {children}
  </h5>
);

const H6 = ({ children, ...props }: any) => (
  <h6 className="text-sm mt-4 mb-2 font-semibold tracking-tight text-muted-foreground scroll-mt-24" {...props}>
    {children}
  </h6>
);

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'append', properties: { className: ['anchor-link'] } }],
        ]}
        components={{
          code: CodeBlock,
          h1: H1,
          h2: H2,
          h3: H3,
          h4: H4,
          h5: H5,
          h6: H6,
          p: ({ children }) => (
            <p className="my-4 leading-[1.8] text-foreground/85">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-4 ml-6 list-disc space-y-1.5 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-6 list-decimal space-y-1.5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.8] text-foreground/85 pl-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 pl-5 border-l-[3px] border-primary/30 bg-muted/40 py-3 pr-4 rounded-r-lg">
              <div className="text-foreground/75 italic leading-[1.8]">{children}</div>
            </blockquote>
          ),
          hr: () => (
            <hr className="my-8 border-border/60" />
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/60">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-muted/30">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground/90 border-b border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-foreground/80 leading-relaxed">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">{children}</del>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full rounded-lg my-6 border border-border/50 shadow-sm"
              loading="lazy"
            />
          ),
          // Task list items
          input: ({ checked, type }) => {
            if (type === 'checkbox') {
              return (
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-4 h-4 rounded border mr-2 -ml-6 align-middle',
                    checked
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background'
                  )}
                >
                  {checked && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              );
            }
            return <input type={type} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
