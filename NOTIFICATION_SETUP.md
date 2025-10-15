# Notification System Setup Guide

## Environment Variables Required

Add these to your `.env` file:

```env
# Web Push VAPID Keys (Already Generated)
VAPID_PUBLIC_KEY=BIqXJtflxQRjsMRttSua2Wn9YrmZLRpXZM_Fs9rGMUak4dxgLvHkfcFt-2U7sx1pd_JCtp6zCmSq-1PGJRnZjCk
VAPID_PRIVATE_KEY=O2TaDogM5qARsEM1xBrvU_YiijMqsEHSfGcAu0bWMuI
VAPID_SUBJECT=mailto:your-email@example.com

# Frontend URL (already should exist)
FRONTEND_URL=http://localhost:8080
```

## Database Migration

After stopping the backend server, run:

```bash
npx prisma generate
npx prisma db push
```

This will create the new notification tables:
- `ab_user_devices` - Store device registrations
- `ab_notifications` - Store notifications with full tracking
- `ab_notification_delivery_status` - Track delivery per device

## Testing the Notification System

1. Register a device from the frontend
2. Send a test notification from admin
3. Check if notification appears on all registered devices
4. Verify WebSocket real-time delivery
5. Test Web Push for closed app scenarios

## Architecture

- **WebSocket (Socket.io)**: Real-time notifications when app is open
- **Web Push API**: Background notifications when app is closed
- **Multi-Device Support**: Same user can receive on multiple devices
- **Delivery Tracking**: Know which devices received/clicked notifications

