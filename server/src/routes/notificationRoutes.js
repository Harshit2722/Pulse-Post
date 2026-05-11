const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const verifyJWT = require('../middleware/authMiddleware');

router.use(verifyJWT); // Protect all notification routes

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
