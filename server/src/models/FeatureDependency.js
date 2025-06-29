const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FeatureDependency = sequelize.define('FeatureDependency', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceFeatureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'features',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Source feature is required' },
        // Custom validation to prevent self-references
        async isNotSelfReference(value) {
          if (value === this.targetFeatureId) {
            throw new Error('A feature cannot depend on itself');
          }
        }
      }
    },
    targetFeatureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'features',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Target feature is required' },
        // Custom validation to ensure both features are in the same team
        async isInSameTeam(value) {
          if (this.sourceFeatureId) {
            const Feature = sequelize.models.Feature;
            const [sourceFeature, targetFeature] = await Promise.all([
              Feature.findByPk(this.sourceFeatureId),
              Feature.findByPk(value)
            ]);
            
            if (!sourceFeature || !targetFeature) {
              throw new Error('One or both features do not exist');
            }
            
            if (sourceFeature.teamId !== targetFeature.teamId) {
              throw new Error('Dependencies can only be created between features in the same team');
            }
          }
        }
      }
    },
    dependencyType: {
      type: DataTypes.ENUM('blocks', 'blocked_by', 'depends_on', 'relates_to'),
      allowNull: false,
      validate: {
        isIn: [['blocks', 'blocked_by', 'depends_on', 'relates_to']]
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Creator is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    }
  }, {
    tableName: 'feature_dependencies',
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    indexes: [
      {
        fields: ['sourceFeatureId']
      },
      {
        fields: ['targetFeatureId']
      },
      {
        fields: ['dependencyType']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['sourceFeatureId', 'dependencyType']
      },
      {
        fields: ['targetFeatureId', 'dependencyType']
      },
      {
        unique: true,
        fields: ['sourceFeatureId', 'targetFeatureId', 'dependencyType'],
        name: 'unique_dependency_relationship'
      }
    ],
    hooks: {
      // Hook to detect circular dependencies before creation
      beforeCreate: async (dependency, options) => {
        await checkCircularDependency(dependency, sequelize);
      },
      beforeUpdate: async (dependency, options) => {
        if (dependency.changed('sourceFeatureId') || dependency.changed('targetFeatureId') || dependency.changed('dependencyType')) {
          await checkCircularDependency(dependency, sequelize);
        }
      }
    }
  });

  return FeatureDependency;
};

// Helper function to detect circular dependencies
async function checkCircularDependency(dependency, sequelize) {
  const { sourceFeatureId, targetFeatureId, dependencyType } = dependency;
  
  // Only check for circular dependencies on blocking relationships
  if (!['blocks', 'blocked_by', 'depends_on'].includes(dependencyType)) {
    return;
  }

  const FeatureDependency = sequelize.models.FeatureDependency;
  
  // For 'blocks' and 'blocked_by', we need to be careful about inverse relationships
  // A -> blocks -> B is the inverse of B -> blocked_by -> A, which is valid
  // But A -> blocks -> B and B -> blocks -> A would be circular
  
  if (dependencyType === 'blocks') {
    // Check if target already blocks source (which would be circular)
    const existingBlocks = await FeatureDependency.findOne({
      where: {
        sourceFeatureId: targetFeatureId,
        targetFeatureId: sourceFeatureId,
        dependencyType: 'blocks'
      }
    });
    
    if (existingBlocks) {
      throw new Error('Creating this dependency would result in a circular dependency');
    }
  } else if (dependencyType === 'blocked_by') {
    // Check if target is already blocked by source (which would be circular)
    const existingBlockedBy = await FeatureDependency.findOne({
      where: {
        sourceFeatureId: targetFeatureId,
        targetFeatureId: sourceFeatureId,
        dependencyType: 'blocked_by'
      }
    });
    
    if (existingBlockedBy) {
      throw new Error('Creating this dependency would result in a circular dependency');
    }
  } else if (dependencyType === 'depends_on') {
    // For depends_on, check if target depends on source
    const existingDependsOn = await FeatureDependency.findOne({
      where: {
        sourceFeatureId: targetFeatureId,
        targetFeatureId: sourceFeatureId,
        dependencyType: 'depends_on'
      }
    });
    
    if (existingDependsOn) {
      throw new Error('Creating this dependency would result in a circular dependency');
    }
  }

  // More comprehensive circular dependency check using graph traversal
  // This checks for longer dependency chains
  // Note: Disabled for now as it was causing false positives with inverse relationships
  // TODO: Implement a more sophisticated graph traversal that properly handles inverse relationships
  
  // const visited = new Set();
  // const hasCircularDependency = await checkCircularPath(
  //   targetFeatureId, 
  //   sourceFeatureId, 
  //   visited, 
  //   FeatureDependency,
  //   sequelize,
  //   dependencyType
  // );

  // if (hasCircularDependency) {
  //   throw new Error('Creating this dependency would result in a circular dependency chain');
  // }
}

// Recursive function to check for circular dependency paths
async function checkCircularPath(currentFeatureId, targetFeatureId, visited, FeatureDependency, sequelize, dependencyType) {
  if (visited.has(currentFeatureId)) {
    return false; // Already visited this node
  }
  
  if (currentFeatureId === targetFeatureId) {
    return true; // Found a circular path
  }

  visited.add(currentFeatureId);

  // Find all features that the current feature depends on or blocks
  // We need to be careful about which relationships to follow based on the dependency type
  let dependencyTypesToFollow = [];
  
  if (dependencyType === 'blocks') {
    // When creating a "blocks" relationship, follow "blocks" and "depends_on" chains
    dependencyTypesToFollow = ['blocks', 'depends_on'];
  } else if (dependencyType === 'blocked_by') {
    // When creating a "blocked_by" relationship, follow "blocked_by" and "depends_on" chains
    dependencyTypesToFollow = ['blocked_by', 'depends_on'];
  } else if (dependencyType === 'depends_on') {
    // When creating a "depends_on" relationship, follow all blocking types
    dependencyTypesToFollow = ['blocks', 'blocked_by', 'depends_on'];
  }

  const dependencies = await FeatureDependency.findAll({
    where: {
      sourceFeatureId: currentFeatureId,
      dependencyType: dependencyTypesToFollow
    }
  });

  for (const dependency of dependencies) {
    const nextFeatureId = dependency.targetFeatureId;
    const hasCircular = await checkCircularPath(nextFeatureId, targetFeatureId, visited, FeatureDependency, sequelize, dependencyType);
    if (hasCircular) {
      return true;
    }
  }

  visited.delete(currentFeatureId);
  return false;
} 