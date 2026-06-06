import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // Configure marked for a better experience
    const html = marked.parse(content, {
      gfm: true,
      breaks: true
    });

    return typeof html === 'string' ? DOMPurify.sanitize(html) : '';
  }, [content]);

  return (
    <div className="h-full overflow-y-auto p-6 bg-background text-text-primary prose prose-invert max-w-none
      prose-headings:font-serif prose-headings:italic prose-headings:text-primary
      prose-a:text-primary hover:prose-a:text-primary-hover
      prose-code:text-amber-500 prose-code:bg-surface prose-code:px-1 prose-code:rounded
      prose-pre:bg-surface
      prose-blockquote:border-l-primary prose-blockquote:text-text-secondary
      prose-ul:list-disc prose-ol:list-decimal">
      <div
        dangerouslySetInnerHTML={{ __html: renderedContent }}
        className="markdown-body"
      />
      {/* Fallback for empty content */}
      {!content && (
        <div className="flex items-center justify-center h-full text-text-muted italic">
          Preview will appear here...
        </div>
      )}
    </div>
  );
};
