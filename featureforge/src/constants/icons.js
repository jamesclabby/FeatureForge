/**
 * Centralized Icon Mappings
 * Using Lucide React icons for consistent, professional iconography
 */
import { 
  Package, 
  BookOpen, 
  Wrench, 
  Search, 
  FileText, 
  Users, 
  BarChart3, 
  ClipboardList,
  Layers
} from 'lucide-react';

// Feature type icons - used in badges, cards, and type indicators
export const FEATURE_TYPE_ICONS = {
  parent: Package,       // Container/package for child features
  story: BookOpen,       // User story/narrative
  task: Wrench,          // Technical implementation work
  research: Search,      // Discovery/research work
  default: FileText      // Fallback icon
};

// Home page feature section icons
export const HOME_FEATURE_ICONS = {
  management: ClipboardList,   // Feature request management
  prioritization: Layers,      // Prioritization tools
  collaboration: Users,        // Team collaboration
  analytics: BarChart3         // Analytics dashboard
};

// Icon size presets for consistency
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

/**
 * Get the icon component for a feature type
 * @param {string} type - Feature type (parent, story, task, research)
 * @returns {Component} - Lucide icon component
 */
export function getFeatureTypeIcon(type) {
  return FEATURE_TYPE_ICONS[type] || FEATURE_TYPE_ICONS.default;
}
