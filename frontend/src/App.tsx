import React, { useState, useEffect, useRef } from 'react';
import { User, Gamepad2, Trophy, History, MessageCircle, Users, Crown, Target, Clock, Zap, Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, Send, Settings } from 'lucide-react';

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
    currentStreak: 3,
    avatar: null,
    joinDate: '2024-01-15',
    favoriteCategory: 'Animals',
    achievements: ['First Win', 'Speed Demon', 'Question Master']
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

  // Voice Control Component (Simplified for settings)
  const VoiceSettings = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-800 text-sm">Voice Settings</span>
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            voiceEnabled ? 'bg-purple-600' : 'bg-gray-300'
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
            <span className="text-purple-600 font-medium">High</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Auto-transcribe</span>
            <span className="text-green-600 font-medium">On</span>
          </div>
        </div>
      )}
    </div>
  );

// Login/Signup Screen with Forgot Password
// Complete Password Reset Flow
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    username: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check URL for reset token on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      // Validate token with your backend here
      validateResetToken(token);
    }
  }, []);

  const validateResetToken = async (token) => {
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/validate-reset-token?token=${token}`);
      if (!response.ok) {
        alert('Invalid or expired reset link');
        setShowResetPassword(false);
        // Clear the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      alert('Error validating reset link');
      setShowResetPassword(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser(mockUser);
    setCurrentScreen('lobby');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      // Replace with your actual API call
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        alert('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        resetForm();
      } else {
        alert('Error sending reset email. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending reset email. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate password strength (optional)
    if (formData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // Replace with your actual API call
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          newPassword: formData.newPassword 
        }),
      });

      if (response.ok) {
        alert('Password updated successfully! You can now login with your new password.');
        // Clear the URL and reset state
        window.history.replaceState({}, document.title, window.location.pathname);
        setShowResetPassword(false);
        setResetToken('');
        resetForm();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error updating password. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating password. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ 
      email: '', 
      password: '', 
      username: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Whisper Chase: 20 Questions</h1>
          <p className="text-white/70">Think. Guess. Win.</p>
        </div>

        {showResetPassword ? (
          // Reset Password Form (accessed via email link)
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Set New Password</h2>
            <p className="text-white/70 text-sm mb-6 text-center">
              Enter your new password below.
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                required
                minLength="8"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                required
                minLength="8"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Update Password
              </button>
            </form>

            <button
              onClick={() => {
                setShowResetPassword(false);
                setResetToken('');
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full mt-4 text-white/70 hover:text-white transition-colors underline"
            >
              Back to Login
            </button>
          </div>
        ) : showForgotPassword ? (
          // Forgot Password Form
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Reset Password</h2>
            <p className="text-white/70 text-sm mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Send Reset Link
              </button>
            </form>

            <button
              onClick={resetForm}
              className="w-full mt-4 text-white/70 hover:text-white transition-colors underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          // Login/Signup Form
          <div>
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-white/70 hover:text-white text-sm underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
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
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Whisper Chase: 20 Questions
              </span>
              {voiceEnabled && (
                <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full ml-2 inline-flex">
                  <Volume2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Voice</span>
                </div>
              )}
            </div>
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    currentScreen === id
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block font-medium">{label}</span>
                </button>
              ))}
            </div>
            <div className="ml-4 pl-4 border-l border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:block font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Modern Profile Screen
  const ProfileScreen = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header Section */}
            <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 px-8 py-12">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-start space-x-6">
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl w-28 h-28 flex items-center justify-center border border-white/30">
                  <User className="w-14 h-14 text-white" />
                </div>
                <div className="text-white flex-1">
                  <h1 className="text-4xl font-bold mb-2">{user?.username}</h1>
                  <p className="text-white/80 text-lg mb-4">{user?.email}</p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">Streak: {user?.currentStreak}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Crown className="w-5 h-5" />
                      <span className="font-semibold">Best: {user?.bestStreak}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Performance Stats</h2>
                <div className="text-sm text-gray-500">
                  Member since {new Date(user?.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{user?.totalGames}</div>
                  <div className="text-emerald-700 font-semibold">Total Games</div>
                  <div className="text-sm text-emerald-600 mt-1">All time</div>
                </div>
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{user?.gamesWon}</div>
                  <div className="text-blue-700 font-semibold">Games Won</div>
                  <div className="text-sm text-blue-600 mt-1">Victory count</div>
                </div>
                <div className="group bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{user?.winRate}%</div>
                  <div className="text-purple-700 font-semibold">Win Rate</div>
                  <div className="text-sm text-purple-600 mt-1">Success ratio</div>
                </div>
              </div>

              {/* Achievements */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Achievements</h3>
                <div className="flex flex-wrap gap-3">
                  {user?.achievements.map((achievement, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full border border-yellow-200">
                      <span className="text-yellow-800 font-medium text-sm">🏆 {achievement}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Category */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Favorite Category</h3>
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{user?.favoriteCategory}</div>
                    <div className="text-sm text-gray-600">Most played category</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <VoiceSettings />
          
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Games Today</span>
                <span className="font-bold text-gray-800">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Questions</span>
                <span className="font-bold text-gray-800">14.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fastest Win</span>
                <span className="font-bold text-gray-800">8 questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Lobby Screen
  const LobbyScreen = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-purple-100 p-2 rounded-xl mr-3">
              <Gamepad2 className="w-6 h-6 text-purple-600" />
            </div>
            Create Game
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentScreen('game')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Start New Game
            </button>
            <div className="text-center text-gray-500">
              <p>Think of a word and let others guess!</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-green-100 p-2 rounded-xl mr-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            Join Game
          </h2>
          <div className="space-y-3">
            {mockGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors hover:shadow-md">
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
          <VoiceSettings />
        </div>
      </div>
    </div>
  );

  // Streamlined Game Screen with Integrated Voice
  const GameScreen = () => {
    const [questionsAsked, setQuestionsAsked] = useState(3);
    const [currentRole, setCurrentRole] = useState('guesser');
    const [gameInputMessage, setGameInputMessage] = useState('');
    
    const gameMessages = [
      { id: 1, user: 'You', message: 'Is it alive?', type: 'question', answer: 'No', hasAudio: true, timestamp: '2:34 PM' },
      { id: 2, user: 'You', message: 'Is it bigger than a car?', type: 'question', answer: 'Yes', hasAudio: false, timestamp: '2:35 PM' },
      { id: 3, user: 'You', message: 'Is it man-made?', type: 'question', answer: 'Yes', hasAudio: true, timestamp: '2:36 PM' }
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
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Game Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Whisper Chase: 20 Questions</h1>
                  <p className="text-white/80">vs QuestionMaster</p>
                </div>
                {voiceEnabled && (
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
                        <div className="bg-purple-100 p-2 rounded-full">
                          <User className="w-4 h-4 text-purple-600" />
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
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border-l-4 border-emerald-400">
                        <div className="flex items-center space-x-2">
                          <div className="bg-emerald-100 p-1 rounded-full">
                            <Target className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-semibold text-emerald-700">Answer: {msg.answer}</span>
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
            {isRecording && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-semibold">Recording...</span>
                  </div>
                  <div className="text-red-600 font-mono text-lg">
                    {formatTime(recordingDuration)}
                  </div>
                </div>
              </div>
            )}

            {/* Transcription Status */}
            {isTranscribing && (
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
                  className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all bg-gray-50 hover:bg-white"
                  rows="2"
                  autoComplete="off"
                />
                {gameInputMessage && (
                  <button
                    onClick={() => {
                      setGameInputMessage('');
                      setTranscription('');
                      setAudioBlob(null);
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Voice Controls */}
              {voiceEnabled && (
                <div className="flex items-center space-x-2">
                  {/* Record Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' 
                        : 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-200'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-6 h-6 text-white" />
                    ) : (
                      <Mic className="w-6 h-6 text-white" />
                    )}
                  </button>
                  
                  {/* Audio Playback Controls */}
                  {audioBlob && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={isPlaying ? pauseAudio : playAudio}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-colors shadow-md"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!gameInputMessage.trim()}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center shadow-lg"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>

            {/* Game Actions */}
            {currentRole === 'guesser' && questionsAsked < 20 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold shadow-lg transform hover:scale-105">
                  Make Final Guess
                </button>
                
                <div className="text-sm text-gray-500">
                  Press Enter to send • {voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                </div>
              </div>
            )}

            {/* Hidden Audio Element */}
            <audio 
              ref={audioRef} 
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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