import React, { useState, useEffect } from 'react';
import { MessageCircle, Volume2, User, Target, Send, RotateCcw, Mic, MicOff, Info, X, ArrowLeft } from 'lucide-react';
import { GameMessage, GameScreenProps } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { apiClient } from '@/lib/apiClient';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  gameData,
  onBackToLobby,
  voiceState,
  startRecording,
  stopRecording,
  playAudio,
  pauseAudio,
  clearTranscription
}) => {
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [currentRole, setCurrentRole] = useState('guesser');
  const [gameInputMessage, setGameInputMessage] = useState('');
  const [gameMessages, setGameMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinalGuessMode, setIsFinalGuessMode] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);

  const handleSendMessage = async () => {
    if (!gameInputMessage.trim() || !gameData || questionsAsked >= 20 || gameEnded) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isFinalGuessMode) {
        // Handle final guess - increment questions asked first
        const newQuestionsAsked = questionsAsked + 1;
        setQuestionsAsked(newQuestionsAsked);
        
        console.log('Making final guess:', gameInputMessage);
        
        const response = await apiClient.makeGuess(gameData.game_id, gameInputMessage.trim());
        
        if (response.error) {
          console.error('Failed to make guess:', response.error);
          setError(response.error);
          return;
        }

        if (response.data) {
          console.log('Guess response received:', response.data);
          
          // Extract the correct value and secret word from nested response
          let correctValue = response.data.correct;
          let resultMessage = 'Unknown';
          let extractedSecretWord = null;
          
          if (typeof correctValue === 'object' && correctValue !== null) {
            // Handle nested structure like {"correct": {"correct": true, "message": "...", "secret_word": "..."}}
            if ('correct' in correctValue) {
              const isCorrect = correctValue.correct;
              resultMessage = isCorrect ? 'Correct' : 'Incorrect';
              
              // Extract secret word from the nested object
              if ('secret_word' in correctValue) {
                extractedSecretWord = correctValue.secret_word;
              }
              
              // If there's a message, use that for display
              if ('message' in correctValue && correctValue.message) {
                resultMessage = correctValue.message;
              }
            }
          } else if (typeof correctValue === 'string') {
            resultMessage = correctValue;
          } else if (typeof correctValue === 'boolean') {
            resultMessage = correctValue ? 'Correct' : 'Incorrect';
          }
          
          // Also check for secret_word at the top level
          if (!extractedSecretWord && response.data.secret_word) {
            extractedSecretWord = response.data.secret_word;
          }
          
          // Create a new message with the guess and result
          const newMessage: GameMessage = {
            id: newQuestionsAsked,
            user: 'You',
            message: gameInputMessage.trim(),
            type: 'guess',
            answer: resultMessage,
            hasAudio: voiceState.audioBlob !== null,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          };

          // Add the message to the chat
          setGameMessages(prev => [...prev, newMessage]);
          
          // Clear the input and transcription
          setGameInputMessage('');
          clearTranscription();
          setIsFinalGuessMode(false);

          // Check if guess is correct - look for "correct" in the message or boolean true
          const isCorrectGuess = (typeof correctValue === 'object' && correctValue?.correct === true) ||
                                resultMessage.toLowerCase().includes('correct');
          
          if (isCorrectGuess) {
            setGameEnded(true);
            setGameResult('won');
            if (extractedSecretWord) {
              setSecretWord(extractedSecretWord);
            }
          } else {
            // Guess was incorrect
            if (newQuestionsAsked >= 20) {
              // All questions used up
              setGameEnded(true);
              setGameResult('lost');
              if (extractedSecretWord) {
                setSecretWord(extractedSecretWord);
              }
            } else {
              // Can continue asking questions
              setError('Incorrect guess! You can continue asking questions.');
              setTimeout(() => setError(null), 3000);
            }
          }
        }
      } else {
        // Handle regular question
        console.log('Sending question to API:', gameInputMessage);
        
        const response = await apiClient.askQuestion(gameData.game_id, gameInputMessage.trim());
        
        if (response.error) {
          console.error('Failed to ask question:', response.error);
          setError(response.error);
          return;
        }

        if (response.data) {
          console.log('Question response received:', response.data);
          
          // Extract the answer value - handle nested object structure
          let answerValue = response.data.answer;
          let displayAnswer = 'Unknown';
          
          if (typeof answerValue === 'object' && answerValue !== null) {
            // Handle nested structure like {"answer": "Maybe"}
            if ('answer' in answerValue) {
              displayAnswer = String(answerValue.answer);
            } else {
              // If it's an object but no 'answer' key, stringify it
              displayAnswer = JSON.stringify(answerValue);
            }
          } else if (typeof answerValue === 'string') {
            displayAnswer = answerValue;
          } else {
            displayAnswer = String(answerValue);
          }
          
          // Create a new message with the question and answer
          const newMessage: GameMessage = {
            id: response.data.question_number,
            user: 'You',
            message: gameInputMessage.trim(),
            type: 'question',
            answer: displayAnswer,
            hasAudio: voiceState.audioBlob !== null,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          };

          // Add the message to the chat
          setGameMessages(prev => [...prev, newMessage]);
          
          // Update questions asked count
          setQuestionsAsked(response.data.question_number);
          
          // Check if we've reached the 20 question limit
          if (response.data.question_number >= 20) {
            setGameEnded(true);
            setGameResult('lost');
          }
          
          // Clear the input and transcription
          setGameInputMessage('');
          clearTranscription();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGameInputMessage(e.target.value);
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && questionsAsked < 20 && !gameEnded) {
        handleSendMessage();
      }
    }
  };

  const handleClearInput = () => {
    setGameInputMessage('');
    clearTranscription();
    if (error) setError(null);
  };

  const handleMakeFinalGuess = () => {
    setIsFinalGuessMode(true);
    setGameInputMessage('');
    clearTranscription();
    if (error) setError(null);
  };

  const handleCancelGuess = () => {
    setIsFinalGuessMode(false);
    setGameInputMessage('');
    clearTranscription();
    if (error) setError(null);
  };

  const handleReturnToLobby = () => {
    // Clear any error states before returning to lobby
    setError(null);
    console.log('Returning to lobby from game screen');
    onBackToLobby();
  };

  // Auto-populate input with transcription
  useEffect(() => {
    if (voiceState.transcription) {
      setGameInputMessage(voiceState.transcription);
    }
  }, [voiceState.transcription]);

  // Helper function to get answer styling based on answer value
  const getAnswerStyling = (answer: string) => {
    // Add type check to ensure answer is a string
    if (typeof answer !== 'string') {
      return {
        containerClasses: 'bg-gray-50 p-4 rounded-xl border-l-4 border-gray-200',
        iconBgClasses: 'bg-gray-200',
        textClasses: 'text-gray-600'
      };
    }

    const answerLower = answer.toLowerCase();
    const isCorrect = answerLower.includes('correct') || answerLower === 'yes';
    const isIncorrect = answerLower.includes('incorrect') || answerLower.includes('not correct') || answerLower === 'no';
    
    if (isCorrect) {
      return {
        containerClasses: 'bg-gradient-to-r from-success-green/10 to-success-green/20 p-4 rounded-xl border-l-4 border-success-green',
        iconBgClasses: 'bg-success-green/30',
        textClasses: 'text-success-green'
      };
    } else if (isIncorrect) {
      return {
        containerClasses: 'bg-red-50 p-4 rounded-xl border-l-4 border-red-200',
        iconBgClasses: 'bg-red-200',
        textClasses: 'text-red-600'
      };
    } else {
      // For "Maybe" or other neutral responses
      return {
        containerClasses: 'bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-200',
        iconBgClasses: 'bg-yellow-200',
        textClasses: 'text-yellow-700'
      };
    }
  };

  // Function to get a friendly host name from the host player ID
  const getHostName = (hostPlayerId: string): string => {
    // If it looks like a UUID, convert it to a friendly name
    if (hostPlayerId && hostPlayerId.includes('-')) {
      return 'GameMaster AI';
    }
    return hostPlayerId || 'Unknown Host';
  };

  // Check if input should be disabled
  const isInputDisabled = isLoading || questionsAsked >= 20 || gameEnded;

  // Show loading state if no game data
  if (!gameData) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card variant="elevated" className="p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-2">Loading Game...</h2>
          <p className="text-gray-600">Setting up your game session</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card variant="elevated" className="overflow-hidden">
        {/* Game Header with Back Button */}
        <div className="bg-gradient-to-r from-purple-primary via-purple-primary to-pink-accent px-8 py-6">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
              {/* Back to Lobby Button */}
              <button
                onClick={handleReturnToLobby}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-200 hover:scale-105 group"
                title="Return to Lobby"
              >
                <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              
              <div>
                <h1 className="font-display text-2xl font-bold">Whisper Chase <br/> 20 Questions</h1>
                <p className="text-white/80">
                  {gameData.game_type === 'solo' ? 'Solo Game' : `Multiplayer (${gameData.max_players} max)`}
                  {' • '}
                  Difficulty: {gameData.difficulty}/5
                </p>
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
                <div className="font-display text-2xl font-bold">{questionsAsked}</div>
                <div className="text-sm text-white/80">Questions</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-bold">{20 - questionsAsked}</div>
                <div className="text-sm text-white/80">Remaining</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold capitalize">{currentRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Info Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Mystery Word: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">
                    {gameEnded && secretWord ? secretWord : 'Revealed at end'}
                  </span>
                  <br />
                  <span className="text-gray-500">• Ask yes/no questions to discover it!</span>
                  {gameData.guessed_word && gameData.guessed_word.trim() !== '' && (
                    <span className="ml-2">
                      • Your Initial Guess: <span className="font-mono bg-purple-100 px-2 py-1 rounded text-xs">{gameData.guessed_word}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Host</div>
              <div className="font-semibold text-gray-800">{getHostName(gameData.host_player_id)}</div>
            </div>
          </div>
        </div>

        {/* Final Guess Mode Banner */}
        {isFinalGuessMode && !gameEnded && (
          <div className="bg-gradient-to-r from-orange-100 to-yellow-100 px-8 py-4 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 w-3 h-3 rounded-full animate-pulse"></div>
                <span className="font-semibold text-orange-800">Final Guess Mode</span>
                <span className="text-orange-700 text-sm">Type your final answer below</span>
              </div>
              <button
                onClick={handleCancelGuess}
                disabled={isInputDisabled}
                className="text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
                title="Cancel final guess"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Game Over Banner */}
        {gameEnded && (
          <div className={`px-8 py-6 border-b ${
            gameResult === 'won' 
              ? 'bg-gradient-to-r from-success-green/20 to-success-green/30 border-success-green/30' 
              : 'bg-gradient-to-r from-red-100 to-red-200 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${
                  gameResult === 'won' ? 'bg-success-green' : 'bg-red-500'
                }`}></div>
                <div>
                  <span className={`font-bold text-lg ${
                    gameResult === 'won' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {gameResult === 'won' ? '🎉 Congratulations! You Won!' : '😔 Game Over'}
                  </span>
                  <div className={`text-sm ${
                    gameResult === 'won' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {secretWord ? `The word was: ${secretWord}` : 'All questions used'}
                    {gameResult === 'won' && ` • Solved in ${questionsAsked} questions!`}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleReturnToLobby}
                variant={gameResult === 'won' ? 'primary' : 'secondary'}
                className="font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Lobby
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          {gameMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-gray-600 mb-2">Ready to Start!</h3>
              <p className="text-gray-500">Ask your first yes/no question to begin the game.</p>
              <p className="text-gray-400 text-sm mt-2">The mystery word is waiting to be discovered!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gameMessages.map((msg) => {
                const answerStyling = msg.answer ? getAnswerStyling(msg.answer) : null;
                
                return (
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
                        <div className="flex items-center space-x-2">
                          {msg.type === 'guess' && (
                            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
                              GUESS
                            </span>
                          )}
                          <div className="bg-gray-100 px-3 py-1 rounded-full">
                            <span className="text-xs text-gray-600 font-medium">#{msg.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-800 mb-3 text-lg">{msg.message}</div>
                      {msg.answer && answerStyling && (
                        <div className={answerStyling.containerClasses}>
                          <div className="flex items-center space-x-2">
                            <div className={`${answerStyling.iconBgClasses} p-1 rounded-full`}>
                              <Target className={`w-4 h-4 ${answerStyling.textClasses}`} />
                            </div>
                            <span className={`font-semibold ${answerStyling.textClasses}`}>
                              {msg.type === 'guess' ? 'Result' : 'Answer'}: {msg.answer}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                placeholder={
                  gameEnded 
                    ? 'Game has ended'
                    : questionsAsked >= 20
                      ? 'All 20 questions used'
                      : isFinalGuessMode 
                        ? 'Type your final guess...' 
                        : currentRole === 'guesser' 
                          ? 'Ask a yes/no question...' 
                          : 'Answer with Yes or No...'
                }
                className={`w-full p-4 pr-12 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent resize-none transition-all ${
                  isInputDisabled 
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'border-gray-200 bg-gray-50 hover:bg-white'
                }`}
                rows={2}
                autoComplete="off"
                disabled={isInputDisabled}
              />
              {gameInputMessage && !isInputDisabled && (
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
                  disabled={isInputDisabled}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    voiceState.isRecording 
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' 
                      : 'bg-purple-primary hover:bg-purple-primary/90 shadow-lg shadow-purple-primary/20'
                  }`}
                  title={
                    isInputDisabled 
                      ? 'Recording disabled' 
                      : voiceState.isRecording 
                        ? 'Stop recording' 
                        : 'Click to record your question'
                  }
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
              disabled={!gameInputMessage.trim() || isInputDisabled}
              className="w-12 h-12 p-0"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Game Actions */}
          {currentRole === 'guesser' && questionsAsked < 20 && !isFinalGuessMode && !gameEnded && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <Button 
                variant="accent" 
                disabled={isInputDisabled} 
                onClick={handleMakeFinalGuess}
              >
                Make Final Guess
              </Button>
              
              <div className="text-sm text-gray-500">
                Press Enter to send • {voiceState.voiceEnabled ? 'Voice enabled - Click mic to record' : 'Voice disabled'}
                {isLoading && ' • Sending...'}
                {questionsAsked >= 20 && ' • All questions used'}
                {gameEnded && ' • Game ended'}
              </div>
            </div>
          )}

          {/* Cancel Guess Button */}
          {isFinalGuessMode && !gameEnded && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <Button 
                variant="ghost" 
                disabled={isInputDisabled} 
                onClick={handleCancelGuess}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Guess
              </Button>
              
              <div className="text-sm text-gray-500">
                Press Enter to submit your final guess
                {isLoading && ' • Sending...'}
                {questionsAsked >= 20 && ' • This will be your last attempt'}
              </div>
            </div>
          )}

          {/* Game Over Message */}
          {gameEnded && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <div className="text-sm text-gray-600">
                Game has ended • {questionsAsked} questions used
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};