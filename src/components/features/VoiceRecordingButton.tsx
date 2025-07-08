import { MicIcon } from '@/components/icons';
import { useAudioVisualization } from '@/hooks';

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  timeRemaining: number;
  mediaStream: MediaStream | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onBlur?: () => void;
}

export const VoiceRecordingButton = ({
  isRecording,
  isTranscribing,
  timeRemaining,
  mediaStream,
  onStartRecording,
  onStopRecording,
  onBlur
}: VoiceRecordingButtonProps) => {
  const { audioLevels } = useAudioVisualization(isRecording ? mediaStream : null);

  if (isRecording) {
    return (
      <div className="flex items-center bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1.5 space-x-2 transition-all duration-300 ease-out">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
        
        <div className="flex items-center space-x-0.5">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className="w-0.5 bg-red-500 rounded-full transition-all duration-100 ease-out"
              style={{
                height: `${8 + level * 16}px`,
                opacity: 0.6 + level * 0.4
              }}
            />
          ))}
        </div>
        
        <span className="text-red-400 font-mono text-sm flex-shrink-0">
          00:{String(30 - timeRemaining).padStart(2, '0')}
        </span>
        
        <button
          onClick={onStopRecording}
          className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          title={`Stop recording (${timeRemaining}s remaining)`}
        >
          <div className="w-2 h-2 bg-white rounded-sm" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        onBlur?.();
        onStartRecording();
      }}
      disabled={isTranscribing}
      className={`rounded-full transition-colors ${
        isTranscribing
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-600/50 opacity-70 hover:opacity-100'
      }`}
      style={{ padding: '6px' }}
      title={isTranscribing ? 'Transcribing...' : 'Voice input'}
    >
      {isTranscribing ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      ) : (
        <MicIcon />
      )}
    </button>
  );
};