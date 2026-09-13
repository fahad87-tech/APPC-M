import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  block?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  block = false,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // If block is explicitly true and content has no $ delimiters, render as a single formula block
    if (block && !content.includes('$')) {
      try {
        return katex.renderToString(content, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return content;
      }
    }

    // Split by ..., $...$, \[...\] or \(...\)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
    const parts = content.split(regex);

    return parts
      .map((part) => {
        if (!part) return '';
        if (part.startsWith('') && part.endsWith('')) {
          const math = part.slice(2, -2).trim();
          try {
            return katex.renderToString(math, { displayMode: true, throwOnError: false });
          } catch {
            return part;
          }
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            return katex.renderToString(math, { displayMode: false, throwOnError: false });
          } catch {
            return part;
          }
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const math = part.slice(2, -2).trim();
          try {
            return katex.renderToString(math, { displayMode: true, throwOnError: false });
          } catch {
            return part;
          }
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.slice(2, -2).trim();
          try {
            return katex.renderToString(math, { displayMode: false, throwOnError: false });
          } catch {
            return part;
          }
        }
        // Plain text: escape HTML characters
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      })
      .join('');
  }, [content, block]);

  return (
    <span
      className={`katex-math-container ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
