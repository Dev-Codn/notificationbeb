import { PrismaClient } from '@prisma/client';
import webPush from 'web-push';
import deviceManager from './deviceManager.js';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@watersupply.com';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ Web Push configured with VAPID keys');
} else {
  console.warn('⚠️  VAPID keys not configured. Web Push will not work.');
}

/**
 * Notification Service
 * Handles creating, sending, and tracking notifications across multiple devices
 */
class NotificationService {
  constructor() {
    this.socketIO = null; // Will be set by WebSocket server
  }

  /**
   * Set Socket.IO instance for real-time notifications
   */
  setSocketIO(io) {
    this.socketIO = io;
    console.log('✅ Socket.IO connected to Notification Service');
  }

  /**
   * Create and send notification to a user across all their devices
   */
  async sendNotification(userId, notificationData) {
    try {
      const { type, title, body, data, targetUrl, priority = 'normal' } = notificationData;

      // Create notification in database
      const notification = await prisma.abNotification.create({
        data: {
          userId,
          type,
          title,
          body,
          data,
          targetUrl,
          priority,
          deliveredDevices: []
        }
      });

      console.log('📬 Notification created:', notification.id, 'for user:', userId);

      // Get all user devices
      const devices = await deviceManager.getUserDevices(userId);
      
      if (devices.length === 0) {
        console.log('⚠️  No devices registered for user:', userId);
        return notification;
      }

      console.log(`📱 Found ${devices.length} device(s) for user ${userId}`);

      // Send to each device
      const deliveryPromises = devices.map(device => 
        this.sendToDevice(device, notification)
      );

      await Promise.allSettled(deliveryPromises);

      return notification;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(userIds, notificationData) {
    try {
      const promises = userIds.map(userId => 
        this.sendNotification(userId, notificationData)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Bulk notification: ${successful} successful, ${failed} failed`);

      return { successful, failed, results };
    } catch (error) {
      console.error('❌ Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific device
   */
  async sendToDevice(device, notification) {
    try {
      // Track delivery attempt
      const deliveryStatus = await prisma.abNotificationDeliveryStatus.create({
        data: {
          notificationId: notification.id,
          deviceId: device.id,
          deliveryStatus: 'sent'
        }
      });

      // Try WebSocket first (if device is online)
      if (device.isOnline && device.webSocketId && this.socketIO) {
        const sent = this.sendViaWebSocket(device.webSocketId, notification);
        
        if (sent) {
          await this.markAsDelivered(deliveryStatus.id);
          console.log('✅ Sent via WebSocket to device:', device.id);
          return { success: true, method: 'websocket' };
        }
      }

      // Fallback to Web Push (for offline or background delivery)
      if (device.pushSubscription) {
        const result = await this.sendViaWebPush(device.pushSubscription, notification);
        
        if (result.success) {
          await this.markAsDelivered(deliveryStatus.id);
          console.log('✅ Sent via Web Push to device:', device.id);
          return { success: true, method: 'webpush' };
        } else {
          await this.markAsFailed(deliveryStatus.id, result.error);
          
          // If subscription expired (410 Gone), remove device
          if (result.statusCode === 410) {
            console.log('🗑️  Removing expired device subscription:', device.id);
            await deviceManager.unregisterDevice(device.id);
          }
        }
      }

      return { success: false, method: 'none' };
    } catch (error) {
      console.error('❌ Error sending to device:', device.id, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification via WebSocket (real-time)
   */
  sendViaWebSocket(socketId, notification) {
    try {
      if (!this.socketIO) {
        return false;
      }

      this.socketIO.to(socketId).emit('notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        targetUrl: notification.targetUrl,
        priority: notification.priority,
        createdAt: notification.createdAt
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending via WebSocket:', error);
      return false;
    }
  }

  /**
   * Send notification via Web Push API
   */
  async sendViaWebPush(subscription, notification) {
    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        data: {
          notificationId: notification.id,
          type: notification.type,
          targetUrl: notification.targetUrl,
          ...notification.data
        },
        actions: [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });

      const result = await webPush.sendNotification(subscription, payload);
      
      return { success: true, statusCode: result.statusCode };
    } catch (error) {
      console.error('❌ Web Push error:', error);
      
      return { 
        success: false, 
        statusCode: error.statusCode,
        error: error.message 
      };
    }
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(deliveryStatusId) {
    try {
      await prisma.abNotificationDeliveryStatus.update({
        where: { id: deliveryStatusId },
        data: {
          deliveryStatus: 'delivered',
          deliveredAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error marking as delivered:', error);
    }
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(deliveryStatusId, errorMessage) {
    try {
      await prisma.abNotificationDeliveryStatus.update({
        where: { id: deliveryStatusId },
        data: {
          deliveryStatus: 'failed',
          errorMessage
        }
      });
    } catch (error) {
      console.error('❌ Error marking as failed:', error);
    }
  }

  /**
   * Mark notification as clicked
   */
  async markAsClicked(notificationId, deviceId) {
    try {
      // Update delivery status
      await prisma.abNotificationDeliveryStatus.updateMany({
        where: {
          notificationId,
          deviceId
        },
        data: {
          deliveryStatus: 'clicked',
          clickedAt: new Date()
        }
      });

      // Mark notification as read
      await this.markAsRead(notificationId);

      console.log('👆 Notification clicked:', notificationId);
    } catch (error) {
      console.error('❌ Error marking as clicked:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId = null) {
    try {
      const whereClause = { id: notificationId };
      
      if (userId) {
        whereClause.userId = userId;
      }

      const notification = await prisma.abNotification.update({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Broadcast read status to all user's devices via WebSocket
      if (this.socketIO && notification) {
        const devices = await deviceManager.getUserDevices(notification.userId, true);
        
        devices.forEach(device => {
          if (device.webSocketId) {
            this.socketIO.to(device.webSocketId).emit('notification:read-sync', {
              notificationId,
              readAt: notification.readAt
            });
          }
        });
      }

      return notification;
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.abNotification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Update badge count for all devices
      await this.updateBadgeCount(userId);

      console.log(`✅ Marked ${result.count} notifications as read for user:`, userId);
      
      return result;
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      const notifications = await prisma.abNotification.findMany({
        where: {
          userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return notifications;
    } catch (error) {
      console.error('❌ Error getting unread notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, type = null } = options;

      const where = { userId };
      
      if (type) {
        where.type = type;
      }

      const notifications = await prisma.abNotification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      return notifications;
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    try {
      const count = await prisma.abNotification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Update badge count for all user devices
   */
  async updateBadgeCount(userId) {
    try {
      const count = await this.getUnreadCount(userId);
      const devices = await deviceManager.getUserDevices(userId, true);

      devices.forEach(device => {
        if (device.webSocketId && this.socketIO) {
          this.socketIO.to(device.webSocketId).emit('notification:badge-update', {
            count
          });
        }
      });

      return count;
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.abNotification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });

      console.log(`🗑️  Deleted ${result.count} old notifications`);
      
      return result;
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      throw error;
    }
  }

  /**
   * Send test notification (for debugging)
   */
  async sendTestNotification(userId) {
    try {
      return await this.sendNotification(userId, {
        type: 'system_test',
        title: '🧪 Test Notification',
        body: 'This is a test notification from the Water Supply system!',
        priority: 'normal',
        targetUrl: '/dashboard',
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();

