'use client';

import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

const CodeBlock = ({ children, className, inline }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  
  // Extract language from className (format: "language-javascript")
  const language = className?.replace(/language-/, '') || 'text';
  
  // Handle inline code
  if (inline) {
    return (
      <code className="bg-gray-700 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-4">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Copy code"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>

      {/* Language Label */}
      {language !== 'text' && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {language}
        </div>
      )}

      {/* Code Block */}
      <Highlight
        theme={themes.vsDark}
        code={children.trim()}
        language={language as any}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto p-4 rounded-lg bg-gray-800 border border-gray-700`}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;