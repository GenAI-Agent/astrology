'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AstroInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  isMobile?: boolean;
}

export default function AstroInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about your astrology reading...",
  disabled = false,
  isLoading = false,
  className,
  isMobile = false
}: AstroInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !disabled) {
      onSubmit();
    }
  };

  const handleSubmit = () => {
    if (!isLoading && !disabled && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={cn(
            "w-full pl-6 pr-14 py-4 bg-card/80 backdrop-blur-sm border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground transition-all",
            isMobile ? "text-base" : "text-sm sm:text-base"
          )}
          disabled={disabled || isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim() || disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}