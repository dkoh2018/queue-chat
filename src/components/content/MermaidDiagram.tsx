'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

interface CopyButtonProps {
  text: string;
}

const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded border border-slate-600 transition-colors"
      title="Copy Mermaid code"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          Copy Code
        </>
      )}
    </button>
  );
};

interface EnlargeButtonProps {
  onEnlarge: () => void;
}

const EnlargeButton = ({ onEnlarge }: EnlargeButtonProps) => {
  return (
    <button
      onClick={onEnlarge}
      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 sm:p-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white rounded-md border border-slate-600/50 hover:border-slate-500 transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl z-10"
      title="Enlarge diagram"
    >
      <svg
        className="w-3 h-3 sm:w-4 sm:h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
    </button>
  );
};

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const id = useId();
  const graphId = `mermaid-graph-${id}`;

  const handleEnlarge = () => {
    setIsEnlarged(true);
  };

  const handleCloseEnlarged = () => {
    setIsEnlarged(false);
  };

  // Handle ESC key to close enlarged view
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEnlarged) {
        handleCloseEnlarged();
      }
    };

    if (isEnlarged) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isEnlarged]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
      },
      themeVariables: {
        primaryColor: '#1e293b',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#38bdf8',
        lineColor: '#64748b',
        secondaryColor: '#334155',
        tertiaryColor: '#1e293b',
      },
    });

    const renderDiagram = async () => {
      if (!containerRef.current || !chart) {
        setIsLoading(false);
        return;
      }

      try {
        setHasError(false);
        setIsLoading(true);
        // Ensure the chart definition is a string and valid
        const validChart = typeof chart === 'string' ? chart.trim() : '';
        if (!validChart) {
          throw new Error("Mermaid chart is empty or invalid.");
        }
        
        // Remove any style definitions from the chart to allow theme to take precedence
        const chartWithoutStyles = validChart.replace(/style .*/g, '');

        const { svg } = await mermaid.render(graphId, chartWithoutStyles);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer rendering to ensure the DOM is ready
    const timeoutId = setTimeout(() => renderDiagram(), 0);

    return () => clearTimeout(timeoutId);
  }, [chart, graphId]);

  if (hasError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold mb-1">Mermaid Diagram Error</p>
            <p className="text-sm text-red-200">There was an error rendering this diagram. Please check the syntax.</p>
          </div>
          <CopyButton text={chart} />
        </div>
        <details className="mt-3">
          <summary className="text-sm text-red-300 cursor-pointer hover:text-red-100 transition-colors">
            Show raw code
          </summary>
          <pre className="mt-2 p-3 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-100 overflow-x-auto">
            <code>{chart}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      <div className="mermaid-diagram-container w-full p-4 relative">
        {isLoading && <div className="text-gray-400">Loading diagram...</div>}
        <div ref={containerRef} className="w-full" style={{ display: isLoading ? 'none' : 'block' }} />
        
        {/* Enlarge button - only show when diagram is successfully rendered */}
        {!isLoading && !hasError && (
          <EnlargeButton onEnlarge={handleEnlarge} />
        )}
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="relative w-full max-w-[92vw] lg:max-w-[88vw] xl:max-w-[85vw] h-full max-h-[90vh] lg:max-h-[88vh] bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-600/60 shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleCloseEnlarged}
              className="absolute top-4 right-4 p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200 z-20 shadow-lg hover:shadow-xl"
              title="Close enlarged view (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Enlarged diagram container */}
            <div className="w-full h-full p-8 sm:p-10 lg:p-12 overflow-auto">
              <div className="flex items-center justify-center min-h-full">
                <div
                  dangerouslySetInnerHTML={{
                    __html: containerRef.current?.innerHTML || ''
                  }}
                  className="w-full max-w-none"
                  style={{
                    transform: 'scale(1.2)',
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(MermaidDiagram);