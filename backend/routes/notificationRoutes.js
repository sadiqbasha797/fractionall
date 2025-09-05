const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get notifications for the authenticated user
router.get('/', authMiddleware(['user', 'admin', 'superadmin']), getNotifications);

// Get unread notification count
router.get('/unread-count', authMiddleware(['user', 'admin', 'superadmin']), getUnreadCount);

// Mark a specific notification as read
router.patch('/:notificationId/read', authMiddleware(['user', 'admin', 'superadmin']), markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware(['user', 'admin', 'superadmin']), markAllAsRead);

// Delete a notification
router.delete('/:notificationId', authMiddleware(['user', 'admin', 'superadmin']), deleteNotification);

// Get notification statistics (admin/superadmin only)
router.get('/stats', authMiddleware(['admin', 'superadmin']), getNotificationStats);

module.exports = router;
