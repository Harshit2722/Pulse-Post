const Notification = require('../models/notificationModel');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require("../utils/ApiError");

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('sender', 'name avatar')
        .populate('post', 'title')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, notifications, "Notifications fetched")
    );
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) throw new ApiError(404, "Notification not found");
    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot mark someone else's notification as read");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) throw new ApiError(404, "Notification not found");
    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot delete someone else's notification");
    }

    await notification.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Notification removed")
    );
});

const clearAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipient: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {}, "All notifications cleared")
    );
});

module.exports = { getNotifications, markAsRead, deleteNotification, clearAllNotifications };
