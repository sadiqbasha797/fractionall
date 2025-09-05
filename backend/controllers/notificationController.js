const NotificationService = require('../utils/notificationService');
const logger = require('../utils/logger');

// Get notifications for the authenticated user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await NotificationService.getUserNotifications(
      userId,
      userRole,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true'
    );

    res.json({
      status: 'success',
      body: result,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getNotifications: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await NotificationService.getUserNotifications(
      userId,
      userRole,
      1,
      1,
      true
    );

    res.json({
      status: 'success',
      body: { unreadCount: result.pagination.unreadCount },
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getUnreadCount: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const notification = await NotificationService.markAsRead(
      notificationId,
      userId,
      userRole
    );

    res.json({
      status: 'success',
      body: { notification },
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger(`Error in markAsRead: ${error.message}`);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await NotificationService.markAllAsRead(userId, userRole);

    res.json({
      status: 'success',
      body: { modifiedCount: result.modifiedCount },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger(`Error in markAllAsRead: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const notification = await NotificationService.deleteNotification(
      notificationId,
      userId,
      userRole
    );

    res.json({
      status: 'success',
      body: {},
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger(`Error in deleteNotification: ${error.message}`);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get notification statistics (for admin/superadmin)
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only admin and superadmin can access this
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        status: 'failed',
        body: {},
        message: 'Access denied'
      });
    }

    const result = await NotificationService.getUserNotifications(
      userId,
      userRole,
      1,
      1,
      false
    );

    const stats = {
      totalNotifications: result.pagination.totalNotifications,
      unreadNotifications: result.pagination.unreadCount,
      readNotifications: result.pagination.totalNotifications - result.pagination.unreadCount
    };

    res.json({
      status: 'success',
      body: { stats },
      message: 'Notification statistics retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getNotificationStats: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
};
