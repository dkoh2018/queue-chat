'use client';

import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import CodeBlock from './CodeBlock';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const MarkdownMessage = ({ content, className = '' }: MarkdownMessageProps) => {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          // Handle code blocks and inline code separately
          code({ node, inline, className, children, ...props }) {
            if (inline) {
              // Render inline code as simple <code> tag (no block elements)
              return (
                <code 
                  className="bg-gray-600 text-gray-100 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-500"
                  {...props}
                >
                  {children}
                </code>
              );
            } else {
              // Render code blocks using CodeBlock component
              return (
                <CodeBlock
                  className={className}
                  inline={false}
                >
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              );
            }
          },
          // Style other markdown elements
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed text-gray-200">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-3 mt-4 text-white border-b border-gray-600 pb-1">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 space-y-2 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 space-y-2 pl-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-200 relative flex">
              <span className="absolute -left-4 text-blue-400">•</span>
              <div className="flex-1">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-2">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">{children}</em>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;