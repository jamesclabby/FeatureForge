import React from 'react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  text = null,
  fullScreen = false 
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-accent',
    secondary: 'border-foreground-secondary',
    white: 'border-white',
    muted: 'border-foreground-muted'
  };

  const spinner = (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizeClasses[size],
        colorClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center gap-3',
      fullScreen && 'min-h-screen bg-background-base'
    )}>
      {spinner}
      {text && (
        <p className="text-sm text-foreground-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background-base bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={clsx('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <div className="rounded-full bg-background-elevated h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-background-elevated rounded w-3/4"></div>
            <div className="h-4 bg-background-elevated rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ count = 1, className = '' }) => {
  return (
    <div className={clsx('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-6 animate-pulse bg-background-surface">
          <div className="flex items-center space-x-4 mb-4">
            <div className="rounded-full bg-background-elevated h-12 w-12"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-background-elevated rounded w-1/4"></div>
              <div className="h-4 bg-background-elevated rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-background-elevated rounded"></div>
            <div className="h-4 bg-background-elevated rounded w-5/6"></div>
            <div className="h-4 bg-background-elevated rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
