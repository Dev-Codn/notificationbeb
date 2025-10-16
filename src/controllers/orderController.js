import notificationService from '../services/notificationService.js';
import prisma from '../lib/prisma.js';

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereClause = status && status !== 'all' ? { status: status.toUpperCase() } : {};
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { name: true, phone: true }
        },
        rider: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => ({
      id: `#${order.id.slice(-4)}`,
      customer: order.customer.name,
      phone: order.customer.phone,
      bottles: Math.floor(Math.random() * 10) + 1, // Mock data for bottles
      amount: parseFloat(order.totalAmount),
      status: order.status.toLowerCase(),
      rider: order.rider?.name || 'Not assigned',
      date: order.createdAt.toISOString().split('T')[0],
      paid: order.paymentStatus === 'PAID'
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        rider: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { customerId, totalAmount, notes, priority = 'NORMAL' } = req.body;

    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount: parseFloat(totalAmount),
        notes,
        priority: priority.toUpperCase(),
        status: 'PENDING'
      },
      include: {
        customer: true
      }
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, riderId } = req.body;

    const updateData = { status: status.toUpperCase() };
    if (riderId) {
      updateData.riderId = riderId;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        rider: {
          include: {
            user: true
          }
        }
      }
    });

    // Send notification when order is assigned to rider
    if (riderId && order.rider?.userId) {
      await notificationService.sendNotification(order.rider.userId, {
        type: 'order_assigned',
        title: '📦 New Order Assigned',
        body: `Order from ${order.customer.name} - ${order.customer.phone}`,
        priority: order.priority.toLowerCase(),
        targetUrl: `/rider/orders/${order.id}`,
        data: {
          orderId: order.id,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          totalAmount: order.totalAmount.toString()
        }
      }).catch(err => console.error('Failed to send notification:', err));
    }

    // Send notification when order is delivered (to admin)
    if (status.toUpperCase() === 'DELIVERED') {
      // Get admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // Send notification to all admins
      for (const admin of adminUsers) {
        await notificationService.sendNotification(admin.id, {
          type: 'order_completed',
          title: '✅ Order Delivered',
          body: `Order for ${order.customer.name} has been delivered by ${order.rider?.name || 'Rider'}`,
          priority: 'normal',
          targetUrl: `/admin/orders/${order.id}`,
          data: {
            orderId: order.id,
            customerName: order.customer.name,
            riderName: order.rider?.name,
            totalAmount: order.totalAmount.toString()
          }
        }).catch(err => console.error('Failed to send notification:', err));
      }
    }

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};
