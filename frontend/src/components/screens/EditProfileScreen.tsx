import React, { useState } from 'react';
import { User, Save, X, Upload, Camera } from 'lucide-react';
import { EditProfileScreenProps } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

const CATEGORY_OPTIONS = [
  'General',
  'Animals',
  'Science',
  'History',
  'Sports',
  'Entertainment',
  'Technology',
  'Food & Drink',
  'Geography',
  'Literature'
];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    bio: user.bio || '',
    favoriteCategory: user.favoriteCategory || 'General',
    avatar_url: user.avatar_url || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (formData.avatar_url && !isValidUrl(formData.avatar_url)) {
      newErrors.avatar_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create updated user object
      const updatedUser: User = {
        ...user,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        favoriteCategory: formData.favoriteCategory,
        avatar_url: formData.avatar_url.trim(),
        // Update username to match full_name for consistency
        username: formData.full_name.trim(),
        // Update avatar for backward compatibility
        avatar: formData.avatar_url.trim() || null
      };

      // Call the onSave callback
      onSave(updatedUser);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) {
        return;
      }
    }
    onCancel();
  };

  const handleAvatarUpload = () => {
    // Placeholder for future avatar upload functionality
    alert('Avatar upload functionality coming soon! For now, you can enter an image URL in the Avatar URL field below.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card variant="elevated" className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-primary to-pink-accent px-8 py-6">
          <div className="flex justify-between items-center text-white">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center">
                <User className="w-8 h-8 mr-3" />
                Edit Profile
              </h1>
              <p className="text-white/80 mt-2">Update your personal information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 shadow-md focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 bg-white text-purple-primary hover:bg-white/90 hover:shadow-lg shadow-md focus:ring-2 focus:ring-purple-primary focus:ring-offset-2 focus:ring-offset-purple-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {/* General Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="lg:col-span-1">
              <Card className="p-6 text-center">
                <h3 className="font-display text-lg font-bold text-gray-800 mb-4">Profile Picture</h3>
                
                <div className="flex flex-col items-center space-y-4">
                  <Avatar 
                    src={formData.avatar_url} 
                    fullName={formData.full_name} 
                    size="2xl"
                    className="ring-4 ring-purple-primary/20"
                  />
                  
                  <div className="space-y-2 w-full">
                    <Button
                      variant="secondary"
                      onClick={handleAvatarUpload}
                      disabled={isLoading}
                      className="w-full"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    
                    <div className="text-xs text-gray-500">
                      Or enter an image URL below
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-display text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-colors ${
                        errors.full_name 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      placeholder="Enter your full name"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-colors ${
                        errors.email 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  disabled={isLoading}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-colors ${
                    errors.avatar_url 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="https://example.com/your-avatar.jpg"
                />
                {errors.avatar_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.avatar_url}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter a URL to an image you'd like to use as your profile picture
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  maxLength={500}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-colors resize-none ${
                    errors.bio 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="Tell us a bit about yourself..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio ? (
                    <p className="text-sm text-red-600">{errors.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Share a brief description about yourself
                    </p>
                  )}
                  <span className={`text-sm ${formData.bio.length > 450 ? 'text-red-600' : 'text-gray-400'}`}>
                    {formData.bio.length}/500
                  </span>
                </div>
              </div>

              {/* Favorite Category - Single Selection Circles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Favorite Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleInputChange('favoriteCategory', category)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.favoriteCategory === category
                          ? 'bg-purple-primary text-white hover:bg-purple-primary/90'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Choose your preferred question category
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end lg:hidden">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 text-gray-600 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-md focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-primary to-pink-accent text-white hover:from-purple-primary/90 hover:to-pink-accent/90 hover:shadow-lg shadow-md focus:ring-2 focus:ring-purple-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};