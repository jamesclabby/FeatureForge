import apiService from './api';

class AnalyticsService {
  /**
   * Get comprehensive team analytics
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} - Analytics data
   */
  async getTeamAnalytics(teamId) {
    try {
      // Get all team features
      const featuresResponse = await apiService.get(`/teams/${teamId}/features`);
      const features = featuresResponse.data || featuresResponse;

      // Calculate various analytics
      const analytics = {
        overview: this.calculateOverviewMetrics(features),
        statusDistribution: this.calculateStatusDistribution(features),
        priorityAnalysis: this.calculatePriorityAnalysis(features),
        typeDistribution: this.calculateTypeDistribution(features),
        effortImpactMatrix: this.calculateEffortImpactMatrix(features),
        timelineAnalytics: this.calculateTimelineAnalytics(features),
        velocity: this.calculateVelocity(features),
        trends: this.calculateTrends(features)
      };

      return { data: analytics };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate overview metrics
   */
  calculateOverviewMetrics(features) {
    const total = features.length;
    const completed = features.filter(f => f.status === 'done').length;
    const inProgress = features.filter(f => f.status === 'in_progress').length;
    const avgVotes = features.reduce((sum, f) => sum + (f.votes || 0), 0) / total || 0;
    
    return {
      totalFeatures: total,
      completedFeatures: completed,
      inProgressFeatures: inProgress,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
      averageVotes: avgVotes.toFixed(1)
    };
  }

  /**
   * Calculate status distribution for pie chart
   */
  calculateStatusDistribution(features) {
    const statusCounts = features.reduce((acc, feature) => {
      const status = feature.status || 'backlog';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      name: this.getStatusLabel(status),
      count,
      percentage: ((count / features.length) * 100).toFixed(1)
    }));
  }

  /**
   * Calculate priority analysis for bar chart
   */
  calculatePriorityAnalysis(features) {
    const priorityCounts = features.reduce((acc, feature) => {
      const priority = feature.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const priorityOrder = ['low', 'medium', 'high', 'critical'];
    return priorityOrder.map(priority => ({
      priority,
      name: this.getPriorityLabel(priority),
      count: priorityCounts[priority] || 0,
      percentage: (((priorityCounts[priority] || 0) / features.length) * 100).toFixed(1)
    }));
  }

  /**
   * Calculate type distribution for pie chart
   */
  calculateTypeDistribution(features) {
    const typeCounts = features.reduce((acc, feature) => {
      const type = feature.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      name: this.getTypeLabel(type),
      count,
      percentage: ((count / features.length) * 100).toFixed(1)
    }));
  }

  /**
   * Calculate effort vs impact matrix for scatter plot
   */
  calculateEffortImpactMatrix(features) {
    return features
      .filter(f => f.effort && f.impact)
      .map(feature => ({
        id: feature.id,
        title: feature.title,
        effort: feature.effort,
        impact: feature.impact,
        votes: feature.votes || 0,
        status: feature.status,
        priority: feature.priority,
        score: this.calculateFeatureScore(feature)
      }));
  }

  /**
   * Calculate feature score (priority-weighted impact vs effort)
   */
  calculateFeatureScore(feature) {
    const priorityWeight = {
      'low': 0.5,
      'medium': 1.0,
      'high': 1.5,
      'critical': 2.0
    }[feature.priority] || 1.0;

    const impact = feature.impact || 5;
    const effort = feature.effort || 5;
    
    return ((impact * priorityWeight * 10) / effort).toFixed(2);
  }

  /**
   * Calculate velocity (features completed over time)
   */
  calculateVelocity(features) {
    const completedFeatures = features.filter(f => f.status === 'done');
    const weeklyData = this.groupFeaturesByWeek(completedFeatures);

    return {
      weeklyData,
      totalCompleted: completedFeatures.length,
      averagePerWeek: weeklyData.length > 0 ? 
        (weeklyData.reduce((sum, week) => sum + week.completed, 0) / weeklyData.length).toFixed(1) : 0
    };
  }

  /**
   * Group features by week for timeline charts
   */
  groupFeaturesByWeek(features) {
    const weeks = {};
    
    features.forEach(feature => {
      const date = new Date(feature.updatedAt || feature.createdAt);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { 
          week: weekKey, 
          weekLabel: this.formatWeekLabel(weekStart),
          created: 0, 
          completed: 0 
        };
      }
      
      if (feature.status === 'done') {
        weeks[weekKey].completed++;
      } else {
        weeks[weekKey].created++;
      }
    });

    return Object.values(weeks)
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-8); // Last 8 weeks
  }

  /**
   * Calculate timeline analytics for status progression
   */
  calculateTimelineAnalytics(features) {
    const monthlyData = this.groupFeaturesByMonth(features);
    return {
      monthlyData,
      statusProgression: this.calculateStatusProgression(features)
    };
  }

  /**
   * Group features by month
   */
  groupFeaturesByMonth(features) {
    const months = {};
    
    features.forEach(feature => {
      const date = new Date(feature.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          monthLabel: this.formatMonthLabel(date),
          backlog: 0,
          in_progress: 0,
          review: 0,
          done: 0
        };
      }
      
      const status = feature.status || 'backlog';
      months[monthKey][status]++;
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }

  /**
   * Calculate status progression over time
   */
  calculateStatusProgression(features) {
    // This would ideally track status changes over time
    // For now, we'll use current status and creation date
    return this.groupFeaturesByMonth(features);
  }

  /**
   * Calculate trends
   */
  calculateTrends(features) {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekFeatures = features.filter(f => new Date(f.createdAt) >= lastWeek);
    const lastWeekFeatures = features.filter(f => {
      const created = new Date(f.createdAt);
      return created >= twoWeeksAgo && created < lastWeek;
    });

    return {
      featureCreationTrend: this.calculateTrendPercentage(lastWeekFeatures.length, thisWeekFeatures.length),
      thisWeekCreated: thisWeekFeatures.length
    };
  }

  /**
   * Calculate trend percentage
   */
  calculateTrendPercentage(previous, current) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  }

  /**
   * Helper functions
   */
  getStatusLabel(status) {
    const statusLabels = {
      'backlog': 'Backlog',
      'in_progress': 'In Progress',
      'review': 'Review',
      'done': 'Done',
      'planned': 'Planned',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  }

  getPriorityLabel(priority) {
    const priorityLabels = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical',
      'urgent': 'Critical'
    };
    return priorityLabels[priority] || priority;
  }

  formatWeekLabel(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  formatMonthLabel(date) {
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Get human-readable type label
   */
  getTypeLabel(type) {
    const typeLabels = {
      'parent': 'Parent',
      'story': 'Story', 
      'task': 'Task',
      'research': 'Research',
      'unknown': 'Unknown'
    };
    return typeLabels[type] || type;
  }
}

export const analyticsService = new AnalyticsService(); 