import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple class names together, handling Tailwind CSS conflicts
 * Uses clsx for conditional class names and tailwind-merge to handle conflicts
 * 
 * @param  {...any} inputs - Class names or conditional class objects
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 