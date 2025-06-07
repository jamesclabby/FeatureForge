const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Notifications with pagination
   */
  static async getUserNotifications(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type = null 
    } = options;

    const offset = (page - 1) * limit;
    const whereClause = { userId };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'trigger',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      notifications,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      unreadCount: await this.getUnreadCount(userId)
    };
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Unread count
   */
  static async getUnreadCount(userId) {
    return await Notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for permission check)
   * @returns {Promise<Object>} - Updated notification
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.update({ isRead: true });
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of updated notifications
   */
  static async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );

    return updatedCount;
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for permission check)
   */
  static async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.destroy();
  }

  /**
   * Clean up old notifications (older than 30 days)
   * @returns {Promise<number>} - Number of deleted notifications
   */
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo
        }
      }
    });

    return deletedCount;
  }
}

module.exports = NotificationService; 