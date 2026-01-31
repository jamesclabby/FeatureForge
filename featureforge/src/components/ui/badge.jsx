import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: "bg-accent-100 text-accent",
  secondary: "bg-background-elevated text-foreground-secondary",
  outline: "border border-border text-foreground-secondary",
  destructive: "bg-error-100 text-error",
  success: "bg-success-100 text-success",
  warning: "bg-warning-100 text-warning"
};

const Badge = ({ 
  children, 
  variant = "default", 
  className, 
  ...props 
}) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant] || badgeVariants.default,
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge, badgeVariants };
