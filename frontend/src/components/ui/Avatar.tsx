import React from 'react';
import { User } from 'lucide-react';
import { getInitials, getInitialsBackgroundColor } from '@/utils/avatarUtils';

interface AvatarProps {
  src?: string | null;
  fullName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  fullName = '', 
  size = 'md', 
  className = '' 
}) => {
  const initials = getInitials(fullName);
  const bgColor = getInitialsBackgroundColor(initials);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      case 'xl':
        return 'w-16 h-16 text-lg';
      case '2xl':
        return 'w-28 h-28 text-2xl';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const sizeClasses = getSizeClasses();

  if (src) {
    return (
      <div className={`${sizeClasses} rounded-2xl overflow-hidden border border-white/30 shadow-sm ${className}`}>
        <img 
          src={src} 
          alt={`${fullName}'s avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-2xl flex items-center justify-center text-purple-primary font-initials font-bold shadow-sm border border-white/30 backdrop-blur-lg ${bgColor} ${className}`}>
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
};