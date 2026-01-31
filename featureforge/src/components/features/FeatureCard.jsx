import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { getColorClassesByName } from '../../constants/designTokens';

// Helper function to get status/priority details
const getStatusDetails = (statusValue) => {
  return FEATURE_STATUSES.find(status => status.value === statusValue) || {
    value: statusValue,
    label: statusValue,
    color: 'gray'
  };
};

const getPriorityDetails = (priorityValue) => {
  return FEATURE_PRIORITIES.find(priority => priority.value === priorityValue) || {
    value: priorityValue,
    label: priorityValue,
    color: 'gray'
  };
};

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const FeatureCard = ({ feature, onVote, onClick }) => {
  const statusDetails = getStatusDetails(feature.status);
  const priorityDetails = getPriorityDetails(feature.priority);
  const typeDetails = getFeatureTypeDetails(feature.type || 'task');

  // Get badge colors from centralized design tokens
  const statusColor = getColorClassesByName(statusDetails.color, 'status');
  const priorityColor = getColorClassesByName(priorityDetails.color, 'priority');

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="text-foreground-secondary line-clamp-2">{feature.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className={`${typeDetails.color} flex items-center gap-1`}>
                <typeDetails.Icon className="h-3.5 w-3.5" />
                {typeDetails.label}
              </Badge>
              
              <Badge className={statusColor}>
                {statusDetails.label}
              </Badge>
              
              <Badge className={priorityColor}>
                {priorityDetails.label} Priority
              </Badge>
              
              {feature.tags && feature.tags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-background-elevated">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div 
            className="flex flex-col items-center space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 py-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                onVote(feature.id);
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="m19 14-7-7-7 7"/>
              </svg>
            </Button>
            <span className="text-sm font-medium text-foreground">{feature.votes}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-border bg-background-elevated py-3 text-xs text-foreground-muted">
        <div className="flex justify-between items-center w-full">
          <span>Created {formatDate(feature.createdAt)}</span>
          <span>{feature.comments_count || feature.comments?.length || 0} comments</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FeatureCard;
