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
      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-md transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl z-10"
      style={{
        backgroundColor: '#252628',
        borderColor: 'rgba(55, 56, 58, 0.5)',
        borderWidth: '1px'
      }}
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.5); // Default 150%
  const [showZoomOptions, setShowZoomOptions] = useState(false);
  const id = useId();
  const graphId = `mermaid-graph-${id}`;

  const zoomOptions = [0.5, 1.0, 1.5, 2.0, 2.5]; // 50%, 100%, 150%, 200%, 250%

  const handleEnlarge = () => {
    setIsEnlarged(true);
  };

  const handleCloseEnlarged = () => {
    setIsEnlarged(false);
    setZoomLevel(1.5); // Reset zoom when closing
    setShowZoomOptions(false); // Close zoom options
    
    // Force a layout recalculation to ensure proper cleanup
    requestAnimationFrame(() => {
      void document.body.offsetHeight;
    });
  };

  const handleZoomIn = () => {
    const currentIndex = zoomOptions.findIndex(zoom => zoom === zoomLevel);
    if (currentIndex < zoomOptions.length - 1) {
      setZoomLevel(zoomOptions[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomOptions.findIndex(zoom => zoom === zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(zoomOptions[currentIndex - 1]);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1.5); // Reset to default 150%
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    setShowZoomOptions(false);
  };

  const toggleZoomOptions = () => {
    setShowZoomOptions(prev => !prev);
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
      // Store original overflow values more safely
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      // Apply overflow hidden to prevent background scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Mobile-specific viewport fixes
      if (window.innerWidth < 768) {
        // Prevent iOS Safari address bar interference
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        // Prevent overscroll bounce on iOS
        document.body.style.overscrollBehavior = 'none';
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore original overflow values safely
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        
        // Restore mobile-specific properties
        if (window.innerWidth < 768) {
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
          document.body.style.overscrollBehavior = '';
        }
        
        // Force a layout recalculation to prevent any lingering scaling issues
        void document.body.offsetHeight;
      };
    }
  }, [isEnlarged]);

  // Separate effect for handling click outside zoom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showZoomOptions) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowZoomOptions(false);
        }
      }
    };

    if (showZoomOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showZoomOptions]);

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
        setErrorMessage(''); // Clear any previous error message
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
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        console.error('Chart content:', chart);
        setHasError(true);
        setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
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
            <p className="text-sm text-red-200">{errorMessage}</p>
          </div>
          <CopyButton text={chart} />
        </div>
        <details className="mt-3">
          <summary className="text-sm text-red-300 cursor-pointer hover:text-red-100 transition-colors">
            Show raw code
          </summary>
          <pre className="mt-2 p-3 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-100 overflow-x-auto chat-scroll">
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-6 sm:p-8 lg:p-12" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}>
                      <div 
              className="relative w-full max-w-[92vw] lg:max-w-[88vw] xl:max-w-[85vw] h-full max-h-[90vh] lg:max-h-[88vh] backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: '#161618',
                borderColor: 'rgba(55, 56, 58, 0.6)',
                borderWidth: '1px',
                // Mobile-specific optimizations
                maxHeight: window?.innerWidth < 768 ? '95vh' : '88vh',
                maxWidth: window?.innerWidth < 768 ? '95vw' : '88vw',
                // Prevent mobile viewport issues
                position: 'relative',
                zIndex: 10
              }}
            >
            {/* Close button */}
            <button
              onClick={handleCloseEnlarged}
              className="absolute top-4 right-4 w-8 h-8 text-slate-300 hover:text-white rounded-md border transition-all duration-200 z-20 shadow-lg hover:shadow-xl flex items-center justify-center"
              style={{
                backgroundColor: '#252628',
                borderColor: 'rgba(55, 56, 58, 0.5)'
              }}
              title="Close enlarged view (ESC)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Zoom controls - Inside modal but outside scrollable area */}
            <div className="absolute bottom-4 left-4 flex flex-row gap-2 z-20">
              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="w-8 h-8 text-slate-300 hover:text-white rounded-md border transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{
                  backgroundColor: '#252628',
                  borderColor: 'rgba(55, 56, 58, 0.5)'
                }}
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </button>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                className="w-8 h-8 text-slate-300 hover:text-white rounded-md border transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{
                  backgroundColor: '#252628',
                  borderColor: 'rgba(55, 56, 58, 0.5)'
                }}
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              {/* Reset Zoom */}
              <button
                onClick={handleResetZoom}
                className="w-8 h-8 text-slate-300 hover:text-white rounded-md border transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                style={{
                  backgroundColor: '#252628',
                  borderColor: 'rgba(55, 56, 58, 0.5)'
                }}
                title="Reset zoom (150%)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Zoom percentage selector - clickable dropdown */}
              <div className="relative">
                <button
                  onClick={toggleZoomOptions}
                  className="w-12 h-8 text-slate-300 hover:text-white text-xs rounded-md border transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center font-mono cursor-pointer"
                  style={{
                    backgroundColor: '#252628',
                    borderColor: 'rgba(55, 56, 58, 0.5)'
                  }}
                  title="Click to change zoom level"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                
                {/* Zoom options dropdown */}
                {showZoomOptions && (
                  <div 
                    className="absolute bottom-full left-0 mb-1 rounded-md border shadow-lg"
                    style={{
                      backgroundColor: '#252628',
                      borderColor: 'rgba(55, 56, 58, 0.5)'
                    }}
                  >
                    {zoomOptions.map((zoom) => (
                      <button
                        key={zoom}
                        onClick={() => handleZoomChange(zoom)}
                        className={`w-12 h-8 text-xs font-mono transition-all duration-200 flex items-center justify-center hover:text-white first:rounded-t-md last:rounded-b-md ${
                          zoomLevel === zoom ? 'text-white' : 'text-slate-300'
                        }`}
                        style={{
                          backgroundColor: zoomLevel === zoom ? 'rgba(55, 56, 58, 0.7)' : 'transparent'
                        }}
                      >
                        {Math.round(zoom * 100)}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Enlarged diagram container */}
            <div className="w-full h-full p-8 sm:p-10 lg:p-12 overflow-auto chat-scroll">
              <div className="flex items-center justify-start min-h-full">
                <div
                  dangerouslySetInnerHTML={{
                    __html: containerRef.current?.innerHTML || ''
                  }}
                  className="w-full max-w-none"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center left',
                    // Prevent transform from affecting parent layout
                    containIntrinsicSize: 'none',
                    contain: 'layout style'
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