'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import MermaidDiagram from './MermaidDiagram';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const MarkdownMessage = ({ content, className = '' }: MarkdownMessageProps) => {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Handle code blocks and inline code separately
          code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode; }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (lang === 'mermaid' && !inline) {
              const chart = React.Children.toArray(children).map(child => {
                if (typeof child === 'string') {
                  return child;
                }
                // Handle cases where the child might be a React element (e.g., from syntax highlighting)
                if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
                  return React.Children.toArray(child.props.children).join('');
                }
                return '';
              }).join('');
              return <MermaidDiagram chart={chart} />;
            }
            
            if (inline) {
              // Render inline code as simple <code> tag (no block elements)
              return (
                <code
                  className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-700"
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
                >
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              );
            }
          },
          // Style other markdown elements
          p: ({ children }) => {
            // Check if children contain block-level elements (like code blocks)
            const hasBlockElements = React.Children.toArray(children).some((child) => {
              // Check for React elements that are block-level
              if (React.isValidElement(child)) {
                // Direct block elements
                if (child.type === 'div' || child.type === 'pre' || child.type === 'blockquote' || child.type === 'table') {
                  return true;
                }
                // Code blocks (our custom component) - check both function name and displayName
                if (typeof child.type === 'function') {
                  const componentName = (child.type as { displayName?: string; name?: string }).displayName || (child.type as { name?: string }).name;
                  if (componentName === 'CodeBlock') {
                    return true;
                  }
                }
                // Check if it's our CodeBlock component by reference
                if (child.type === CodeBlock) {
                  return true;
                }
                // Check props for block code indicators
                const props = child.props as { className?: string; inline?: boolean };
                if (props.className?.includes('language-') && !props.inline) {
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
          // Add table styling
          table: ({ children }) => (
            <div 
              className="my-6 border border-gray-800 rounded-lg shadow-md overflow-x-auto chat-scroll"
              onWheel={(e) => {
                // ALWAYS prioritize vertical scrolling for chat
                if (e.deltaY !== 0) {
                  // Any vertical scroll component - let it bubble to chat immediately
                  return;
                }
                // Only handle pure horizontal scrolling
                if (e.deltaX !== 0 && e.deltaY === 0) {
                  e.stopPropagation();
                }
              }}
              style={{
                // Optimize for mobile
                WebkitOverflowScrolling: 'touch',
                // Prevent issues with scroll chaining
                overscrollBehaviorX: 'contain',
                overscrollBehaviorY: 'none' // Let Y scroll always bubble up
              }}
            >
              <table className="w-full text-sm text-left text-gray-300">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="text-xs text-gray-200 uppercase tracking-wider" style={{ backgroundColor: 'rgba(37, 38, 40, 0.9)' }}>{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-800">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-900/60 transition-colors duration-200 ease-in-out">{children}</tr>
          ),
          th: ({ children }) => (
            <th scope="col" className="py-3 px-6 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="py-4 px-6">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownMessage);