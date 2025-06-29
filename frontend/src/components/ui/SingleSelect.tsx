import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SingleSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, options]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Set highlighted index to current value when opening
        const currentIndex = options.indexOf(value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const displayValue = value || placeholder;
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent 
          transition-all duration-200 text-left flex items-center justify-between
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
            : 'hover:border-gray-400 cursor-pointer bg-white border-gray-300'
          }
          ${isOpen ? 'ring-2 ring-purple-primary border-transparent' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? undefined : 'single-select-label'}
      >
        <span className={hasValue ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1">
          <Card className="py-2 shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            <div ref={dropdownRef}>
              {options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-purple-primary/5 transition-colors duration-150
                    flex items-center justify-between group
                    ${highlightedIndex === index ? 'bg-purple-primary/10' : ''}
                    ${value === option ? 'text-purple-primary font-medium' : 'text-gray-900'}
                  `}
                  role="option"
                  aria-selected={value === option}
                >
                  <span>{option}</span>
                  {value === option && (
                    <Check className="w-4 h-4 text-purple-primary" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};