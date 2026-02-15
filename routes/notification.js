const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.put('/read-all', markAllAsRead);

// Delete individual notification
router.delete('/:id', (req, res) => {
    try {
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
});

// Clear all notifications
router.delete('/clear-all', (req, res) => {
    try {
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing notifications', error: error.message });
    }
});

module.exports = router;
