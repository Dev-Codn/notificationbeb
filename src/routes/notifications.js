import express from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

/**
 * Notification Routes
 * /api/notifications/*
 */

// Device management
router.post('/subscribe', notificationController.subscribeDevice);
router.post('/unsubscribe', notificationController.unsubscribeDevice);
router.get('/devices', notificationController.getUserDevices);
router.delete('/device/:deviceId', notificationController.deleteDevice);

// Notification operations
router.get('/pending', notificationController.getPendingNotifications);
router.post('/mark-read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.get('/history', notificationController.getHistory);
router.get('/unread-count', notificationController.getUnreadCount);

// Settings
router.get('/settings', notificationController.getNotificationSettings);
router.put('/settings', notificationController.updateNotificationSettings);

// Test and utility
router.post('/test', notificationController.sendTestNotification);
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

export default router;

