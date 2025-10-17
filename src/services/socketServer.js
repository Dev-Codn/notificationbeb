import { Server } from 'socket.io';
import deviceManager from './deviceManager.js';
import notificationService from './notificationService.js';

/**
 * WebSocket Server using Socket.io
 * Handles real-time communication for notifications
 */
class SocketServer {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer) {
    // Determine allowed origins
    // ⚠️ ALLOW ALL ORIGINS - For testing/deployment convenience
    // Note: This is less secure but resolves CORS issues across all domains
    const corsConfig = { 
      origin: true, // Allow all origins
      credentials: true, 
      methods: ['GET', 'POST'] 
    };

    this.io = new Server(httpServer, {
      cors: corsConfig,
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'], // Allow both transports for better compatibility
      allowEIO3: true // Allow older clients if needed
    });

    // Connect notification service to Socket.IO
    notificationService.setSocketIO(this.io);

    this.setupEventHandlers();

    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔗 Client connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { userId, deviceId, deviceInfo } = data;

          if (!userId) {
            socket.emit('error', { message: 'User ID required' });
            return;
          }

          // Store user info in socket
          socket.userId = userId;
          socket.deviceId = deviceId;

          // Join user room for broadcasting
          socket.join(`user:${userId}`);

          // Update device status
          if (deviceId) {
            await deviceManager.updateDeviceStatus(deviceId, true, socket.id);
          }

          // Get unread count and send to client
          const unreadCount = await notificationService.getUnreadCount(userId);

          socket.emit('connection:verified', {
            socketId: socket.id,
            userId,
            deviceId,
            unreadCount
          });

          console.log('✅ Client authenticated:', userId, 'Device:', deviceId);
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle notification mark as read
      socket.on('notification:mark-read', async (data) => {
        try {
          const { notificationId } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          await notificationService.markAsRead(notificationId, socket.userId);

          // Broadcast to all user's devices
          this.io.to(`user:${socket.userId}`).emit('notification:read-sync', {
            notificationId,
            readAt: new Date()
          });

          console.log('📖 Notification marked as read:', notificationId);
        } catch (error) {
          console.error('❌ Error marking notification as read:', error);
          socket.emit('error', { message: 'Failed to mark as read' });
        }
      });

      // Handle notification mark as delivered
      socket.on('notification:mark-delivered', async (data) => {
        try {
          const { notificationId } = data;
          
          if (!socket.deviceId) {
            return;
          }

          // Just log it - delivery is tracked on send
          console.log('📬 Notification delivered confirmation:', notificationId);
        } catch (error) {
          console.error('❌ Error marking as delivered:', error);
        }
      });

      // Handle notification clicked
      socket.on('notification:clicked', async (data) => {
        try {
          const { notificationId } = data;
          
          if (!socket.userId || !socket.deviceId) {
            return;
          }

          await notificationService.markAsClicked(notificationId, socket.deviceId);

          console.log('👆 Notification clicked:', notificationId);
        } catch (error) {
          console.error('❌ Error handling notification click:', error);
        }
      });

      // Handle mark all as read
      socket.on('notification:mark-all-read', async () => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          await notificationService.markAllAsRead(socket.userId);

          // Broadcast to all user's devices
          this.io.to(`user:${socket.userId}`).emit('notification:all-read', {
            timestamp: new Date()
          });

          console.log('✅ All notifications marked as read for user:', socket.userId);
        } catch (error) {
          console.error('❌ Error marking all as read:', error);
          socket.emit('error', { message: 'Failed to mark all as read' });
        }
      });

      // Handle device status update
      socket.on('device:status-update', async (data) => {
        try {
          const { status } = data; // 'online', 'away', 'busy'
          
          if (!socket.deviceId) {
            return;
          }

          // You can extend this to store device status
          console.log('📱 Device status update:', socket.deviceId, status);
        } catch (error) {
          console.error('❌ Error updating device status:', error);
        }
      });

      // Handle get unread notifications
      socket.on('notification:get-unread', async () => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const notifications = await notificationService.getUnreadNotifications(socket.userId);

          socket.emit('notification:unread-list', notifications);
        } catch (error) {
          console.error('❌ Error getting unread notifications:', error);
          socket.emit('error', { message: 'Failed to get notifications' });
        }
      });

      // Handle get notification history
      socket.on('notification:get-history', async (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { limit = 50, offset = 0, type = null } = data || {};

          const notifications = await notificationService.getNotificationHistory(
            socket.userId,
            { limit, offset, type }
          );

          socket.emit('notification:history', notifications);
        } catch (error) {
          console.error('❌ Error getting notification history:', error);
          socket.emit('error', { message: 'Failed to get history' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          console.log('🔌 Client disconnected:', socket.id);

          // Mark device as offline
          if (socket.id) {
            await deviceManager.markDeviceOffline(socket.id);
          }

          // Leave user room
          if (socket.userId) {
            socket.leave(`user:${socket.userId}`);
          }
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Send notification to specific user (all devices)
   */
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Send notification to specific socket
   */
  sendToSocket(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    if (this.io) {
      return this.io.engine.clientsCount;
    }
    return 0;
  }
}

export default new SocketServer();

