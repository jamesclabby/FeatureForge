import React from 'react';
import { cn } from '../../utils/cn';

const CharacterCounter = ({ value, limit, className }) => {
  const count = value ? value.length : 0;
  const remaining = limit - count;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  
  return (
    <div className={cn(
      "text-xs text-right",
      isOverLimit 
        ? "text-red-600" 
        : isNearLimit 
          ? "text-orange-600" 
          : "text-secondary-500",
      className
    )}>
      {count}/{limit}
      {isOverLimit && (
        <span className="ml-1 text-red-600">
          ({Math.abs(remaining)} over limit)
        </span>
      )}
    </div>
  );
};

export { CharacterCounter }; 