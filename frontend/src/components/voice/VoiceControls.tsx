import React from 'react';
import { Mic, MicOff, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { VoiceState } from '@/types';
import { formatTime } from '@/utils/formatters';

interface VoiceControlsProps {
  voiceState: VoiceState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayAudio: () => void;
  onPauseAudio: () => void;
  onToggleMute: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voiceState,
  onStartRecording,
  onStopRecording,
  onPlayAudio,
  onPauseAudio,
  onToggleMute
}) => {
  // Always show the microphone button when voice is enabled
  if (!voiceState.voiceEnabled) return null;

  return (
    <div className="flex items-center space-x-2">
      {/* Recording Status */}
      {voiceState.isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center space-x-2">
          <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></div>
          <span className="text-red-700 text-sm font-medium">
            {formatTime(voiceState.recordingDuration)}
          </span>
        </div>
      )}

      {/* Record Button - Always visible when voice is enabled */}
      <button
        onClick={voiceState.isRecording ? onStopRecording : onStartRecording}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 ${
          voiceState.isRecording 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' 
            : 'bg-purple-primary hover:bg-purple-primary/90 shadow-lg shadow-purple-primary/20'
        }`}
        title={voiceState.isRecording ? 'Stop recording' : 'Start recording'}
      >
        {voiceState.isRecording ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
      
      {/* Audio Playback Controls */}
      {voiceState.audioBlob && (
        <div className="flex items-center space-x-2">
          <button
            onClick={voiceState.isPlaying ? onPauseAudio : onPlayAudio}
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-colors shadow-md"
            title={voiceState.isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {voiceState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onToggleMute}
            className="w-8 h-8 bg-gray-500 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
            title={voiceState.isMuted ? 'Unmute' : 'Mute'}
          >
            {voiceState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};