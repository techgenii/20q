import React, { useState, useEffect } from 'react';
import { MessageCircle, Volume2, User, Target, Send, RotateCcw, Mic, MicOff } from 'lucide-react';
import { GameMessage, GameScreenProps } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceControls } from '@/components/voice/VoiceControls';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onBackToLobby,
  voiceState,
  startRecording,
  stopRecording,
  playAudio,
  pauseAudio,
  clearTranscription
}) => {
  const [questionsAsked, setQuestionsAsked] = useState(3);
  const [currentRole, setCurrentRole] = useState('guesser');
  const [gameInputMessage, setGameInputMessage] = useState('');
  
  const gameMessages: GameMessage[] = [
    { id: 1, user: 'You', message: 'Is it alive?', type: 'question', answer: 'No', hasAudio: true, timestamp: '2:34 PM' },
    { id: 2, user: 'You', message: 'Is it bigger than a car?', type: 'question', answer: 'Yes', hasAudio: false, timestamp: '2:35 PM' },
    { id: 3, user: 'You', message: 'Is it man-made?', type: 'question', answer: 'Yes', hasAudio: true, timestamp: '2:36 PM' }
  ];

  const handleSendMessage = () => {
    if (gameInputMessage.trim()) {
      console.log('Sending message:', gameInputMessage);
      setGameInputMessage('');
      setQuestionsAsked(prev => prev + 1);
      clearTranscription();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGameInputMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearInput = () => {
    setGameInputMessage('');
    clearTranscription();
  };

  // Auto-populate input with transcription
  useEffect(() => {
    if (voiceState.transcription) {
      setGameInputMessage(voiceState.transcription);
    }
  }, [voiceState.transcription]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card variant="elevated" className="overflow-hidden">
        {/* Game Header */}
        <div className="bg-gradient-to-r from-purple-primary via-purple-primary to-pink-accent px-8 py-6">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Whisper Chase <br/> 20 Questions</h1>
                <p className="text-white/80">vs QuestionMaster</p>
              </div>
              {voiceState.voiceEnabled && (
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Voice Active</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{questionsAsked}</div>
                <div className="text-sm text-white/80">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{20 - questionsAsked}</div>
                <div className="text-sm text-white/80">Remaining</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold capitalize">{currentRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="space-y-4">
            {gameMessages.map((msg) => (
              <div key={msg.id} className="group">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-primary/10 p-2 rounded-full">
                        <User className="w-4 h-4 text-purple-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{msg.user}</span>
                        <div className="text-xs text-gray-500">{msg.timestamp}</div>
                      </div>
                      {msg.hasAudio && (
                        <button className="text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-xs text-gray-600 font-medium">#{msg.id}</span>
                    </div>
                  </div>
                  <div className="text-gray-800 mb-3 text-lg">{msg.message}</div>
                  {msg.answer && (
                    <div className="bg-gradient-to-r from-success-green/10 to-success-green/20 p-4 rounded-xl border-l-4 border-success-green">
                      <div className="flex items-center space-x-2">
                        <div className="bg-success-green/30 p-1 rounded-full">
                          <Target className="w-4 h-4 text-success-green" />
                        </div>
                        <span className="font-semibold text-success-green">Answer: {msg.answer}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Input Area with Integrated Voice */}
        <div className="p-6 border-t bg-white">
          {/* Voice Recording Status */}
          {voiceState.isRecording && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">Recording...</span>
                </div>
                <div className="text-red-600 font-mono text-lg">
                  {Math.floor(voiceState.recordingDuration / 60)}:{(voiceState.recordingDuration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Transcription Status */}
          {voiceState.isTranscribing && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                <span className="text-yellow-700 font-semibold">Converting speech to text...</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={gameInputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={currentRole === 'guesser' ? 'Ask a yes/no question...' : 'Answer with Yes or No...'}
                className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent resize-none transition-all bg-gray-50 hover:bg-white"
                rows={2}
                autoComplete="off"
              />
              {gameInputMessage && (
                <button
                  onClick={handleClearInput}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Voice Controls - Show microphone button when voice is enabled */}
            {voiceState.voiceEnabled && (
              <div className="flex items-center space-x-2">
                {/* Microphone Button */}
                <button
                  onClick={voiceState.isRecording ? stopRecording : startRecording}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 ${
                    voiceState.isRecording 
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' 
                      : 'bg-purple-primary hover:bg-purple-primary/90 shadow-lg shadow-purple-primary/20'
                  }`}
                  title={voiceState.isRecording ? 'Stop recording' : 'Click to record your question'}
                >
                  {voiceState.isRecording ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Audio Playback Controls */}
                {voiceState.audioBlob && (
                  <VoiceControls
                    voiceState={voiceState}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    onPlayAudio={playAudio}
                    onPauseAudio={pauseAudio}
                    onToggleMute={() => {}}
                  />
                )}
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!gameInputMessage.trim()}
              className="w-12 h-12 p-0"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>

          {/* Game Actions */}
          {currentRole === 'guesser' && questionsAsked < 20 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <Button variant="accent">
                Make Final Guess
              </Button>
              
              <div className="text-sm text-gray-500">
                Press Enter to send • {voiceState.voiceEnabled ? 'Voice enabled - Click mic to record' : 'Voice disabled'}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};