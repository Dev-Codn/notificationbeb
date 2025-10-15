import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearNotifications() {
  try {
    console.log('🗑️  Clearing all notifications...');
    
    // Delete all notification delivery statuses
    const deliveryResult = await prisma.abNotificationDeliveryStatus.deleteMany({});
    console.log(`✅ Deleted ${deliveryResult.count} delivery statuses`);
    
    // Delete all notifications
    const notificationResult = await prisma.abNotification.deleteMany({});
    console.log(`✅ Deleted ${notificationResult.count} notifications`);
    
    // Delete all devices (optional - uncomment if you want to clear devices too)
    // const deviceResult = await prisma.abUserDevice.deleteMany({});
    // console.log(`✅ Deleted ${deviceResult.count} devices`);
    
    console.log('');
    console.log('✨ All notifications cleared successfully!');
    console.log('You can now test the notification system with fresh data.');
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearNotifications();

