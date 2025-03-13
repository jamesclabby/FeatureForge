const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Feature title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Feature description is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['requested', 'planned', 'in-progress', 'completed', 'rejected'],
      default: 'requested'
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    impact: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    effort: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    category: {
      type: String,
      enum: ['ui', 'performance', 'functionality', 'security', 'other'],
      default: 'other'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votes: {
      type: Number,
      default: 0
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    targetRelease: {
      type: String,
      trim: true
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String
      }
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        text: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Calculate a score based on priority, impact, and effort
FeatureSchema.virtual('score').get(function() {
  return (this.priority * 0.4) + (this.impact * 0.4) - (this.effort * 0.2);
});

// Ensure virtuals are included when converting to JSON
FeatureSchema.set('toJSON', { virtuals: true });
FeatureSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Feature', FeatureSchema); 