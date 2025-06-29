'use client';

import React from 'react';
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
          p: ({ children }) => {
            // Check if children contain block-level elements (like code blocks)
            const hasBlockElements = React.Children.toArray(children).some(child => {
              // Check for React elements that are block-level
              if (React.isValidElement(child)) {
                // Direct block elements
                if (child.type === 'div' || child.type === 'pre' || child.type === 'blockquote') {
                  return true;
                }
                // Code blocks (our custom component)
                if (typeof child.type === 'function' && 
                    (child.type.name === 'CodeBlock' || child.type.displayName === 'CodeBlock')) {
                  return true;
                }
                // Check props for block code indicators
                if (child.props?.className?.includes('language-') && !child.props?.inline) {
                  return true;
                }
              }
              return false;
            });

            // If contains block elements, use div to avoid invalid HTML nesting
            const Tag = hasBlockElements ? 'div' : 'p';
            
            return (
              <Tag className="mb-5 last:mb-0 leading-[1.7] text-gray-100 text-[15px] font-normal">
                {children}
              </Tag>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-6 mt-8 text-white leading-tight tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-5 mt-7 text-white leading-tight tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-4 mt-6 text-white leading-tight">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-6 space-y-3 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 space-y-3 pl-6 list-decimal">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-100 text-[15px] leading-relaxed relative">
              <div className="flex items-start">
                <span className="text-blue-400 font-bold mr-3 mt-1 flex-shrink-0">•</span>
                <div className="flex-1">{children}</div>
              </div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500/60 pl-6 py-3 bg-blue-500/5 italic text-gray-300 my-6 rounded-r-lg">
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
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
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