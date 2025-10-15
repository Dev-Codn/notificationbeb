import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Device Manager Service
 * Handles device registration, tracking, and management for push notifications
 */
class DeviceManager {
  /**
   * Register a new device or update existing device subscription
   */
  async registerDevice(userId, deviceInfo) {
    try {
      const { deviceType, deviceName, pushSubscription, fcmToken } = deviceInfo;

      // Check if device already exists (based on endpoint in pushSubscription)
      let existingDevice = null;
      if (pushSubscription?.endpoint) {
        existingDevice = await prisma.abUserDevice.findFirst({
          where: {
            userId,
            pushSubscription: {
              path: ['endpoint'],
              equals: pushSubscription.endpoint
            }
          }
        });
      }

      if (existingDevice) {
        // Update existing device
        const updatedDevice = await prisma.abUserDevice.update({
          where: { id: existingDevice.id },
          data: {
            deviceType,
            deviceName,
            pushSubscription,
            fcmToken,
            isOnline: true,
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log('Device updated:', updatedDevice.id);
        return updatedDevice;
      } else {
        // Create new device
        const newDevice = await prisma.abUserDevice.create({
          data: {
            userId,
            deviceType,
            deviceName,
            pushSubscription,
            fcmToken,
            isOnline: true,
            lastSeen: new Date()
          }
        });
        
        console.log('New device registered:', newDevice.id);
        return newDevice;
      }
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * Unregister a device
   */
  async unregisterDevice(deviceId) {
    try {
      await prisma.abUserDevice.delete({
        where: { id: deviceId }
      });
      
      console.log('Device unregistered:', deviceId);
      return { success: true };
    } catch (error) {
      console.error('Error unregistering device:', error);
      throw error;
    }
  }

  /**
   * Update device online status
   */
  async updateDeviceStatus(deviceId, isOnline, webSocketId = null) {
    try {
      const updateData = {
        isOnline,
        lastSeen: new Date()
      };

      if (webSocketId !== null) {
        updateData.webSocketId = webSocketId;
      }

      const device = await prisma.abUserDevice.update({
        where: { id: deviceId },
        data: updateData
      });

      return device;
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId, onlineOnly = false) {
    try {
      const where = { userId };
      
      if (onlineOnly) {
        where.isOnline = true;
      }

      const devices = await prisma.abUserDevice.findMany({
        where,
        orderBy: { lastSeen: 'desc' }
      });

      return devices;
    } catch (error) {
      console.error('Error getting user devices:', error);
      throw error;
    }
  }

  /**
   * Get device by WebSocket ID
   */
  async getDeviceBySocketId(webSocketId) {
    try {
      const device = await prisma.abUserDevice.findFirst({
        where: { webSocketId }
      });

      return device;
    } catch (error) {
      console.error('Error getting device by socket ID:', error);
      throw error;
    }
  }

  /**
   * Update device WebSocket ID
   */
  async updateWebSocketId(deviceId, webSocketId) {
    try {
      const device = await prisma.abUserDevice.update({
        where: { id: deviceId },
        data: { 
          webSocketId,
          isOnline: true,
          lastSeen: new Date()
        }
      });

      return device;
    } catch (error) {
      console.error('Error updating WebSocket ID:', error);
      throw error;
    }
  }

  /**
   * Mark device as offline (disconnect)
   */
  async markDeviceOffline(webSocketId) {
    try {
      const device = await prisma.abUserDevice.findFirst({
        where: { webSocketId }
      });

      if (device) {
        await prisma.abUserDevice.update({
          where: { id: device.id },
          data: {
            isOnline: false,
            webSocketId: null,
            lastSeen: new Date()
          }
        });
        
        console.log('Device marked offline:', device.id);
      }

      return device;
    } catch (error) {
      console.error('Error marking device offline:', error);
      throw error;
    }
  }

  /**
   * Remove inactive devices (cleanup job)
   */
  async removeInactiveDevices(daysInactive = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const result = await prisma.abUserDevice.deleteMany({
        where: {
          lastSeen: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Removed ${result.count} inactive devices`);
      return result;
    } catch (error) {
      console.error('Error removing inactive devices:', error);
      throw error;
    }
  }

  /**
   * Update notification settings for a device
   */
  async updateNotificationSettings(deviceId, settings) {
    try {
      const device = await prisma.abUserDevice.update({
        where: { id: deviceId },
        data: {
          notificationSettings: settings
        }
      });

      return device;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings for a device
   */
  async getNotificationSettings(deviceId) {
    try {
      const device = await prisma.abUserDevice.findUnique({
        where: { id: deviceId },
        select: { notificationSettings: true }
      });

      return device?.notificationSettings || {};
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }
}

export default new DeviceManager();

