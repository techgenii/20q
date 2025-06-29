/**
 * Generate initials from a full name
 * @param fullName - The full name string
 * @returns Initials (1-2 characters) or empty string if no valid name
 */
export const getInitials = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Trim whitespace and split into words
  const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return '';
  }
  
  if (words.length === 1) {
    // Single name: take first character
    return words[0].charAt(0).toUpperCase();
  }
  
  // Multiple names: take first character of first and last word
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return firstInitial + lastInitial;
};

/**
 * Generate a consistent background color for initials
 * @param initials - The initials string
 * @returns Tailwind CSS background color class
 */
export const getInitialsBackgroundColor = (initials: string): string => {
  // Always use the custom initials background color
  return 'bg-initials-bg';
};