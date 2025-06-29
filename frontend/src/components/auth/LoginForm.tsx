import React, { useState } from 'react';
import { AudioLines } from 'lucide-react';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BoltNewBadge } from '@/components/ui/bolt-new-badge';
import { apiClient } from '@/lib/apiClient';
import { LoginResponse } from '@/types';

interface LoginFormProps {
  onLogin: (loginData: LoginResponse) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let response;
      
      if (isLogin) {
        response = await apiClient.login(formData.email, formData.password);
      } else {
        if (!formData.fullName.trim()) {
          setError('Full name is required for signup');
          setIsLoading(false);
          return;
        }
        response = await apiClient.signup(formData.email, formData.password, formData.fullName);
      }

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        // Pass the full login response to the parent
        onLogin(response.data);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.forgotPassword(formData.email);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
        // Clear the form and go back to login after a short delay
        setTimeout(() => {
          setShowForgotPassword(false);
          setFormData({ email: '', password: '', fullName: '' });
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  return (
    <GradientBackground className="min-h-screen flex items-center justify-center p-4">
      <Card variant="glass" className="p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-primary to-pink-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AudioLines className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Whisper Chase
            <br />
            20 Questions
          </h1>
          <p className="text-white/70">Think. Guess. Win.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
            <p className="text-green-200 text-sm text-center">{successMessage}</p>
          </div>
        )}

        {showForgotPassword ? (
          <div>
            <h2 className="font-display text-xl font-semibold text-white mb-4 text-center">Reset Password</h2>
            <p className="text-white/70 text-sm mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                disabled={isLoading}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent disabled:opacity-50"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <Button 
                variant="accent" 
                className="w-full" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError(null);
                setSuccessMessage(null);
              }}
              disabled={isLoading}
              className="w-full mt-4 text-white/70 hover:text-white transition-colors underline disabled:opacity-50"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="flex mb-6">
              <button
                onClick={() => setIsLogin(true)}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-l-lg font-semibold transition-all disabled:opacity-50 ${
                  isLogin ? 'bg-white text-purple-primary' : 'bg-transparent text-white border border-white/30'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-r-lg font-semibold transition-all disabled:opacity-50 ${
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
                  placeholder="Full Name"
                  required
                  disabled={isLoading}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent disabled:opacity-50"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                disabled={isLoading}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent disabled:opacity-50"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-accent disabled:opacity-50"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={isLoading}
                    className="text-white/70 hover:text-white text-sm underline transition-colors disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button 
                variant="accent" 
                className="w-full" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isLogin ? 'Logging in...' : 'Creating account...') 
                  : (isLogin ? 'Login' : 'Create Account')
                }
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