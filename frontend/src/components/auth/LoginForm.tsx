import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BoltNewBadge } from '@/components/ui/bolt-new-badge';

interface LoginFormProps {
  onLogin: (userData: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    username: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username: formData.username || 'Player123' });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password reset email sent! Check your inbox.');
    setShowForgotPassword(false);
    setFormData({ email: '', password: '', username: '' });
  };

  return (
    <GradientBackground className="min-h-screen flex items-center justify-center p-4">
      <Card variant="glass" className="p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-primary to-pink-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Whisper Chase
            <br />
            20 Questions
          </h1>
          <p className="text-white/70">Think. Guess. Win.</p>
        </div>

        {showForgotPassword ? (
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
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <Button variant="accent" className="w-full" type="submit">
                Send Reset Link
              </Button>
            </form>

            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full mt-4 text-white/70 hover:text-white transition-colors underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="flex mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-l-lg font-semibold transition-all ${
                  isLogin ? 'bg-white text-purple-primary' : 'bg-transparent text-white border border-white/30'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-r-lg font-semibold transition-all ${
                  !isLogin ? 'bg-white text-purple-primary' : 'bg-transparent text-white border border-white/30'
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
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent"
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

              <Button variant="accent" className="w-full" type="submit">
                {isLogin ? 'Login' : 'Create Account'}
              </Button>
            </form>
          </div>
        )}
      </Card>
      
      <BoltNewBadge 
        position="bottom-right" 
        variant="auto" 
        size="small"
      />
    </GradientBackground>
  );
};