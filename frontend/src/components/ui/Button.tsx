import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-purple-primary to-pink-accent text-white hover:from-purple-primary/90 hover:to-pink-accent/90';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300';
      case 'accent':
        return 'bg-gradient-to-r from-pink-accent to-purple-primary text-white hover:from-pink-accent/90 hover:to-purple-primary/90';
      case 'ghost':
        return 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-gray-300';
      case 'danger':
        return 'text-red-600 hover:bg-red-50 border border-red-300';
      default:
        return 'bg-gradient-to-r from-purple-primary to-pink-accent text-white hover:from-purple-primary/90 hover:to-pink-accent/90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  return (
    <button
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-semibold rounded-xl transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};