import React, { useState, useEffect, useRef } from 'react';
import { User, Gamepad2, Trophy, History, MessageCircle, Users, Crown, Target, Clock, Zap, Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

const TwentyQuestionsGame = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // Voice interaction states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Mock data
  const mockUser = {
    id: '1',
    username: 'Player123',
    email: 'player@example.com',
    totalGames: 45,
    gamesWon: 32,
    winRate: 71,
    bestStreak: 8,
    currentStreak: 3
  };

  const mockLeaderboard = [
    { rank: 1, username: 'QuestionMaster', wins: 156, winRate: 89, streak: 12 },
    { rank: 2, username: 'GuessingGuru', wins: 134, winRate: 85, streak: 7 },
    { rank: 3, username: 'MindReader', wins: 128, winRate: 82, streak: 9 },
    { rank: 4, username: 'Player123', wins: 32, winRate: 71, streak: 3 },
    { rank: 5, username: 'BrainBox', wins: 98, winRate: 76, streak: 5 }
  ];

  const mockHistory = [
    { id: 1, opponent: 'QuestionMaster', result: 'won', word: 'Elephant', questions: 15, date: '2024-06-20' },
    { id: 2, opponent: 'GuessingGuru', result: 'lost', word: 'Telescope', questions: 20, date: '2024-06-19' },
    { id: 3, opponent: 'MindReader', result: 'won', word: 'Pizza', questions: 12, date: '2024-06-18' }
  ];

  const mockGames = [
    { id: 1, host: 'QuestionMaster', status: 'waiting', players: 1 },
    { id: 2, host: 'BrainBox', status: 'active', players: 2 },
    { id: 3, host: 'GuessingGuru', status: 'waiting', players: 1 }
  ];

  // Voice interaction functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        transcribeAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    // Mock transcription - replace with actual ElevenLabs API call
    setTimeout(() => {
      const mockTranscriptions = [
        "Is it alive?",
        "Is it bigger than a car?",
        "Is it man-made?",
        "Can you eat it?",
        "Is it found in nature?",
        "Does it move on its own?",
        "Is it electronic?",
        "Yes, that's correct!",
        "No, try again.",
        "I think it's a building!"
      ];
      const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      setTranscription(randomTranscription);
      setInputMessage(randomTranscription);
      setIsTranscribing(false);
    }, 2000);
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice Control Component
  const VoiceControls = ({ inGame = false }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-800">Voice Chat</span>
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            voiceEnabled 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {voiceEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {voiceEnabled && (
        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            
            {audioBlob && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setTranscription('');
                    setInputMessage('');
                  }}
                  className="w-10 h-10 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center">
              <div className="text-red-600 font-semibold">Recording...</div>
              <div className="text-sm text-gray-500">{formatTime(recordingDuration)}</div>
            </div>
          )}

          {/* Transcription */}
          {isTranscribing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                <span className="text-yellow-700 text-sm">Transcribing audio...</span>
              </div>
            </div>
          )}

          {transcription && !isTranscribing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-700 text-sm font-medium mb-1">Transcription:</div>
              <div className="text-gray-800">{transcription}</div>
            </div>
          )}

          {/* Audio Player */}
          <audio 
            ref={audioRef} 
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Hold to record, release to send</span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${
                isMuted ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Login/Signup Screen
  const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });

    const handleSubmit = (e) => {
      e.preventDefault();
      setUser(mockUser);
      setCurrentScreen('lobby');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">20 Questions</h1>
            <p className="text-white/70">Think. Guess. Win.</p>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg font-semibold transition-all ${
                isLogin ? 'bg-white text-purple-900' : 'bg-transparent text-white border border-white/30'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg font-semibold transition-all ${
                !isLogin ? 'bg-white text-purple-900' : 'bg-transparent text-white border border-white/30'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setMessages([]);
    setInputMessage('');
    setGameState(null);
    setVoiceEnabled(false);
    setIsRecording(false);
    setAudioBlob(null);
    setTranscription('');
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-800">20 Questions</span>
            {voiceEnabled && (
              <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                <Volume2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Voice ON</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {[
                { id: 'lobby', icon: Gamepad2, label: 'Lobby' },
                { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'profile', icon: User, label: 'Profile' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setCurrentScreen(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    currentScreen === id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>
            <div className="ml-4 pl-4 border-l border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 backdrop-blur-lg rounded-full w-24 h-24 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{user?.username}</h1>
                  <p className="text-white/80">{user?.email}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Streak: {user?.currentStreak}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5" />
                      <span>Best: {user?.bestStreak}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{user?.totalGames}</div>
                  <div className="text-green-700 font-medium">Total Games</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{user?.gamesWon}</div>
                  <div className="text-blue-700 font-medium">Games Won</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{user?.winRate}%</div>
                  <div className="text-purple-700 font-medium">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <VoiceControls />
        </div>
      </div>
    </div>
  );

  // Lobby Screen
  const LobbyScreen = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Gamepad2 className="w-6 h-6 mr-2 text-purple-600" />
            Create Game
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentScreen('game')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Start New Game
            </button>
            <div className="text-center text-gray-500">
              <p>Think of a word and let others guess!</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-green-600" />
            Join Game
          </h2>
          <div className="space-y-3">
            {mockGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                <div>
                  <div className="font-semibold text-gray-800">{game.host}'s Game</div>
                  <div className="text-sm text-gray-500">
                    Status: <span className={game.status === 'waiting' ? 'text-green-600' : 'text-orange-600'}>{game.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentScreen('game')}
                  disabled={game.status === 'active'}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {game.status === 'waiting' ? 'Join' : 'Full'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <VoiceControls />
        </div>
      </div>
    </div>
  );

  // Game Screen with Enhanced Voice UI
  const GameScreen = () => {
    const [questionsAsked, setQuestionsAsked] = useState(3);
    const [currentRole, setCurrentRole] = useState('guesser');
    const [gameInputMessage, setGameInputMessage] = useState('');
    
    const gameMessages = [
      { id: 1, user: 'You', message: 'Is it alive?', type: 'question', answer: 'No', hasAudio: true },
      { id: 2, user: 'You', message: 'Is it bigger than a car?', type: 'question', answer: 'Yes', hasAudio: false },
      { id: 3, user: 'You', message: 'Is it man-made?', type: 'question', answer: 'Yes', hasAudio: true }
    ];

    const handleSendMessage = () => {
      if (gameInputMessage.trim()) {
        console.log('Sending message:', gameInputMessage);
        setGameInputMessage('');
        setQuestionsAsked(prev => prev + 1);
        setTranscription('');
        setAudioBlob(null);
      }
    };

    const handleInputChange = (e) => {
      setGameInputMessage(e.target.value);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Auto-populate input with transcription
    useEffect(() => {
      if (transcription) {
        setGameInputMessage(transcription);
      }
    }, [transcription]);

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center space-x-4">
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-bold">20 Questions Game</span>
                    {voiceEnabled && (
                      <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                        <Volume2 className="w-3 h-3" />
                        <span className="text-xs">Voice Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Questions: {questionsAsked}/20</span>
                    </div>
                    <div className="text-sm">
                      Role: <span className="font-bold capitalize">{currentRole}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                <div className="space-y-4">
                  {gameMessages.map((msg) => (
                    <div key={msg.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-purple-600">{msg.user}</span>
                          {msg.hasAudio && (
                            <button className="text-blue-500 hover:text-blue-600">
                              <Volume2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">Question #{msg.id}</span>
                      </div>
                      <div className="text-gray-800 mb-2">{msg.message}</div>
                      {msg.answer && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border-l-4 border-green-400">
                          <span className="font-semibold text-green-700">Answer: {msg.answer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-white">
                <div className="flex space-x-3 mb-4">
                  <input
                    type="text"
                    value={gameInputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={currentRole === 'guesser' ? 'Ask a yes/no question...' : 'Answer with Yes or No...'}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!gameInputMessage.trim()}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Send
                  </button>
                </div>
                
                {currentRole === 'guesser' && questionsAsked < 20 && (
                  <div className="flex justify-between items-center">
                    <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold">
                      Make Final Guess
                    </button>
                    
                    {voiceEnabled && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          <span>{isRecording ? 'Stop' : 'Voice'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <VoiceControls inGame={true} />
          </div>
        </div>
      </div>
    );
  };

  // Leaderboard Screen
  const LeaderboardScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Trophy className="w-8 h-8 mr-3" />
            Leaderboard
          </h1>
          <p className="text-white/80 mt-2">Top players this month</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {mockLeaderboard.map((player) => (
              <div key={player.rank} className={`p-4 rounded-xl border-2 transition-all ${
                player.username === user?.username 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      player.rank === 1 ? 'bg-yellow-500' :
                      player.rank === 2 ? 'bg-gray-400' :
                      player.rank === 3 ? 'bg-orange-600' : 'bg-gray-500'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{player.username}</div>
                      <div className="text-sm text-gray-500">{player.wins} wins • {player.winRate}% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">{player.streak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // History Screen
  const HistoryScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <History className="w-8 h-8 mr-3" />
            Game History
          </h1>
          <p className="text-white/80 mt-2">Your recent matches</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockHistory.map((game) => (
              <div key={game.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800">vs {game.opponent}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        game.result === 'won' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {game.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Word: <span className="font-medium">{game.word}</span> • 
                      Questions: {game.questions}/20 • 
                      {game.date}
                    </div>
                  </div>
                  <div className={`text-2xl ${game.result === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                    {game.result === 'won' ? '🏆' : '😔'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  if (!user && currentScreen === 'login') {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-8">
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'lobby' && <LobbyScreen />}
        {currentScreen === 'game' && <GameScreen />}
        {currentScreen === 'leaderboard' && <LeaderboardScreen />}
        {currentScreen === 'history' && <HistoryScreen />}
      </main>
    </div>
  );
};

export default TwentyQuestionsGame;