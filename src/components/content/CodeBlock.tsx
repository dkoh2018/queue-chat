'use client';

import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  children: string;
  className?: string;
}

const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  
  const language = className?.replace(/language-/, '') || 'text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Copy code"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>

      {language !== 'text' && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {language}
        </div>
      )}

      <Highlight
        theme={themes.vsDark}
        code={children.trim()}
        language={language as Parameters<typeof Highlight>[0]['language']}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto chat-scroll p-4 rounded-lg bg-gray-800 border border-gray-700`}
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

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;