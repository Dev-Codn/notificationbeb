-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RIDER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'NOT_PAID', 'OVERPAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_ASSIGNED', 'ORDER_DELIVERED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'SYSTEM_UPDATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "houseNo" TEXT,
    "streetNo" TEXT,
    "area" TEXT,
    "city" TEXT,
    "bottleCount" INTEGER NOT NULL DEFAULT 0,
    "avgDaysToRefill" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "riderId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_PAID',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paymentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceName" TEXT,
    "pushSubscription" JSONB,
    "webSocketId" TEXT,
    "fcmToken" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "targetUrl" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredDevices" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ab_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_notification_delivery_status" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'sent',
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_notification_delivery_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rider_profiles_userId_key" ON "rider_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "ab_user_devices_userId_idx" ON "ab_user_devices"("userId");

-- CreateIndex
CREATE INDEX "ab_user_devices_isOnline_idx" ON "ab_user_devices"("isOnline");

-- CreateIndex
CREATE INDEX "ab_user_devices_webSocketId_idx" ON "ab_user_devices"("webSocketId");

-- CreateIndex
CREATE INDEX "ab_notifications_userId_idx" ON "ab_notifications"("userId");

-- CreateIndex
CREATE INDEX "ab_notifications_type_idx" ON "ab_notifications"("type");

-- CreateIndex
CREATE INDEX "ab_notifications_isRead_idx" ON "ab_notifications"("isRead");

-- CreateIndex
CREATE INDEX "ab_notifications_createdAt_idx" ON "ab_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "ab_notification_delivery_status_notificationId_idx" ON "ab_notification_delivery_status"("notificationId");

-- CreateIndex
CREATE INDEX "ab_notification_delivery_status_deviceId_idx" ON "ab_notification_delivery_status"("deviceId");

-- CreateIndex
CREATE INDEX "ab_notification_delivery_status_deliveryStatus_idx" ON "ab_notification_delivery_status"("deliveryStatus");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "rider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_notification_delivery_status" ADD CONSTRAINT "ab_notification_delivery_status_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "ab_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_notification_delivery_status" ADD CONSTRAINT "ab_notification_delivery_status_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "ab_user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
