import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'primary',
  className = '' 
}) => {
  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-purple-primary via-purple-primary to-pink-accent';
      case 'secondary':
        return 'bg-gradient-to-r from-purple-primary to-pink-accent';
      case 'accent':
        return 'bg-gradient-to-r from-pink-accent to-purple-primary';
      default:
        return 'bg-gradient-to-br from-purple-primary via-purple-primary to-pink-accent';
    }
  };

  return (
    <div className={`${getGradient()} ${className}`}>
      {children}
    </div>
  );
};