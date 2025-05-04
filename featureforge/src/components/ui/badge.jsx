import React from 'react';

const badgeVariants = {
  default: "bg-primary-100 text-primary-800",
  secondary: "bg-secondary-100 text-secondary-800",
  outline: "border border-secondary-200 text-secondary-700",
  destructive: "bg-red-100 text-red-800"
};

const Badge = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  
  // Determine which variant styles to apply
  const variantStyle = badgeVariants[variant] || badgeVariants.default;
  
  // Combine all styles, allowing className to override defaults
  const combinedClassNames = `${baseStyle} ${variantStyle} ${className}`;
  
  return (
    <span className={combinedClassNames} {...props}>
      {children}
    </span>
  );
};

export { Badge, badgeVariants }; 