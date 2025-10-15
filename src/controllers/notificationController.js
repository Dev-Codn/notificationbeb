import notificationService from '../services/notificationService.js';
import deviceManager from '../services/deviceManager.js';

/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */

// Register device for push notifications
export const subscribeDevice = async (req, res) => {
  try {
    const { userId, deviceInfo } = req.body;

    if (!userId || !deviceInfo) {
      return res.status(400).json({
        success: false,
        message: 'User ID and device info are required'
      });
    }

    const device = await deviceManager.registerDevice(userId, deviceInfo);

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: {
        deviceId: device.id,
        userId: device.userId
      }
    });
  } catch (error) {
    console.error('Error subscribing device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message
    });
  }
};

// Unsubscribe device
export const unsubscribeDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    await deviceManager.unregisterDevice(deviceId);

    res.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device',
      error: error.message
    });
  }
};

// Get pending notifications (for polling/iOS)
export const getPendingNotifications = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notifications = await notificationService.getUnreadNotifications(
      userId,
      parseInt(limit)
    );

    const count = notifications.length;

    res.json({
      success: true,
      data: notifications,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
};

// Get notification history
export const getHistory = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0, type } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notifications = await notificationService.getNotificationHistory(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    });

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history',
      error: error.message
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get count',
      error: error.message
    });
  }
};

// Send test notification
export const sendTestNotification = async (req, res) => {
  try {
    const { userId, message = 'Test notification' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notification = await notificationService.sendTestNotification(userId);

    res.json({
      success: true,
      message: 'Test notification sent',
      data: notification
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
};

// Get user devices
export const getUserDevices = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const devices = await deviceManager.getUserDevices(userId);

    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error getting user devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error.message
    });
  }
};

// Delete device
export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    await deviceManager.unregisterDevice(deviceId);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    const settings = await deviceManager.getNotificationSettings(deviceId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: error.message
    });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const { deviceId, settings } = req.body;

    if (!deviceId || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and settings are required'
      });
    }

    const device = await deviceManager.updateNotificationSettings(deviceId, settings);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: device.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// Get VAPID public key (for frontend)
export const getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: 'VAPID public key not configured'
      });
    }

    res.json({
      success: true,
      publicKey
    });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID key',
      error: error.message
    });
  }
};

