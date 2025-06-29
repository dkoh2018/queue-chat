'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const id = useId();
  const graphId = `mermaid-graph-${id}`;

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
        const { svg } = await mermaid.render(graphId, validChart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
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
        <p className="font-bold mb-2">Mermaid Diagram Error</p>
        <p className="text-sm">There was an error rendering this diagram. Please check the syntax.</p>
      </div>
    );
  }

  return (
    <div className="mermaid-diagram-container w-full p-4">
      {isLoading && <div className="text-gray-400">Loading diagram...</div>}
      <div ref={containerRef} className="w-full" style={{ display: isLoading ? 'none' : 'block' }} />
    </div>
  );
};

export default React.memo(MermaidDiagram);