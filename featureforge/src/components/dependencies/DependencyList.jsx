import React from 'react';
import DependencyCard from './DependencyCard';

const DependencyList = ({ dependencies, type, onDelete }) => {
  if (!dependencies || dependencies.length === 0) {
    return (
      <div className="text-center py-4 text-foreground-muted">
        No {type} dependencies
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dependencies.map((dependency) => (
        <DependencyCard
          key={dependency.id}
          dependency={dependency}
          type={type}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DependencyList; 