import { useState, useEffect, useRef } from 'react';

export interface AudioVisualizationState {
  audioLevels: number[];
  isAnalyzing: boolean;
}

export const useAudioVisualization = (mediaStream: MediaStream | null): AudioVisualizationState => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(8).fill(0));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mediaStream) {
      setIsAnalyzing(false);
      setAudioLevels(Array(8).fill(0));
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64; // Small for performance, gives us 32 frequency bins
        analyser.smoothingTimeConstant = 0.8; // Smooth out the data
        analyserRef.current = analyser;

        // Connect media stream to analyser
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        setIsAnalyzing(true);

        // Start analyzing audio
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLevels = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Convert frequency data to 8 bars for visualization
          const bars = Array.from({ length: 8 }, (_, i) => {
            const start = Math.floor(i * dataArray.length / 8);
            const end = Math.floor((i + 1) * dataArray.length / 8);
            const slice = dataArray.slice(start, end);
            const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
            
            // Normalize to 0-1 range and apply some scaling for better visual effect
            const normalized = Math.min(average / 255, 1);
            const scaled = Math.pow(normalized, 0.7); // Make quieter sounds more visible
            
            return scaled;
          });

          setAudioLevels(bars);
          animationFrameRef.current = requestAnimationFrame(updateLevels);
        };

        updateLevels();

      } catch (error) {
        console.error('Failed to setup audio analysis:', error);
        setIsAnalyzing(false);
      }
    };

    setupAudioAnalysis();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      setIsAnalyzing(false);
      setAudioLevels(Array(8).fill(0));
    };
  }, [mediaStream]);

  return {
    audioLevels,
    isAnalyzing
  };
};