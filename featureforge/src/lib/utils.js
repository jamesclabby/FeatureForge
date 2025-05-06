import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names together using clsx and tailwind-merge
 * @param  {...any} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 