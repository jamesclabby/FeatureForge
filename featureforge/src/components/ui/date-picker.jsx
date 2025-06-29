import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

const DatePicker = React.forwardRef(({ 
  label, 
  value, 
  onChange, 
  className, 
  disabled, 
  placeholder = "Select date",
  ...props 
}, ref) => {
  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Handle date change
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (onChange) {
      // Convert to ISO string if date is provided, otherwise pass empty string
      onChange(dateValue ? new Date(dateValue).toISOString() : '');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {label}
        </Label>
      )}
      <Input
        ref={ref}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full"
        {...props}
      />
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export { DatePicker }; 