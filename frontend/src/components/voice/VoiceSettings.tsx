import React from 'react';
import { Settings, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface VoiceSettingsProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceEnabled,
  onToggleVoice
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <Settings className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-800 text-sm">Voice Settings</span>
      </div>
      <button
        onClick={onToggleVoice}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          voiceEnabled ? 'bg-purple-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            voiceEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
    
    {voiceEnabled && (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Audio Quality</span>
          <span className="text-purple-primary font-medium">High</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Auto-transcribe</span>
          <span className="text-success-green font-medium">On</span>
        </div>
      </div>
    )}
  </Card>
);