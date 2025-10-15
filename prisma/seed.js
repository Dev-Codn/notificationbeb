import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('');

  try {
    // Hash password for all users (test123)
    const hashedPassword = await bcrypt.hash('test123', 12);

    // ========== CREATE ADMIN USER ==========
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartsupply.com' }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@smartsupply.com',
          phone: '+923001234567',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          adminProfile: {
            create: {
              name: 'Smart Supply Admin',
              company: 'Smart Supply Water Delivery'
            }
          }
        }
      });
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('ℹ️  Admin user already exists:', adminUser.email);
    }

    // ========== CREATE RIDER 1 ==========
    let rider1User = await prisma.user.findUnique({
      where: { email: 'rider1@smartsupply.com' }
    });

    if (!rider1User) {
      rider1User = await prisma.user.create({
        data: {
          email: 'rider1@smartsupply.com',
          phone: '+923009876541',
          password: hashedPassword,
          role: 'RIDER',
          isActive: true,
          riderProfile: {
            create: {
              name: 'Ahmed Khan',
              phone: '+923009876541'
            }
          }
        }
      });
      console.log('✅ Rider 1 created:', rider1User.email);
    } else {
      console.log('ℹ️  Rider 1 already exists:', rider1User.email);
    }

    // ========== CREATE RIDER 2 ==========
    let rider2User = await prisma.user.findUnique({
      where: { email: 'rider2@smartsupply.com' }
    });

    if (!rider2User) {
      rider2User = await prisma.user.create({
        data: {
          email: 'rider2@smartsupply.com',
          phone: '+923009876542',
          password: hashedPassword,
          role: 'RIDER',
          isActive: true,
          riderProfile: {
            create: {
              name: 'Hassan Ali',
              phone: '+923009876542'
            }
          }
        }
      });
      console.log('✅ Rider 2 created:', rider2User.email);
    } else {
      console.log('ℹ️  Rider 2 already exists:', rider2User.email);
    }

    console.log('');

    // ========== CREATE SAMPLE CUSTOMERS ==========
    const customers = [
      {
        name: 'Fatima Ahmed',
        phone: '+923001111111',
        whatsapp: '+923001111111',
        houseNo: '123',
        streetNo: '5',
        area: 'Gulberg',
        city: 'Lahore',
        bottleCount: 2,
        avgDaysToRefill: 7,
        currentBalance: 0
      },
      {
        name: 'Ali Hassan',
        phone: '+923002222222',
        whatsapp: '+923002222222',
        houseNo: '456',
        streetNo: '10',
        area: 'DHA Phase 5',
        city: 'Karachi',
        bottleCount: 3,
        avgDaysToRefill: 5,
        currentBalance: -500
      },
      {
        name: 'Sara Khan',
        phone: '+923003333333',
        whatsapp: '+923003333333',
        houseNo: '789',
        streetNo: '15',
        area: 'F-7',
        city: 'Islamabad',
        bottleCount: 1,
        avgDaysToRefill: 10,
        currentBalance: 200
      },
      {
        name: 'Usman Malik',
        phone: '+923004444444',
        whatsapp: '+923004444444',
        houseNo: '321',
        streetNo: '8',
        area: 'Bahria Town',
        city: 'Lahore',
        bottleCount: 4,
        avgDaysToRefill: 4,
        currentBalance: 0
      },
      {
        name: 'Ayesha Siddiqui',
        phone: '+923005555555',
        whatsapp: '+923005555555',
        houseNo: '654',
        streetNo: '12',
        area: 'Clifton',
        city: 'Karachi',
        bottleCount: 2,
        avgDaysToRefill: 6,
        currentBalance: -300
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const existing = await prisma.customer.findUnique({
        where: { phone: customerData.phone }
      });

      if (!existing) {
        const customer = await prisma.customer.create({
          data: customerData
        });
        createdCustomers.push(customer);
        console.log(`✅ Customer created: ${customer.name}`);
      } else {
        createdCustomers.push(existing);
        console.log(`ℹ️  Customer already exists: ${existing.name}`);
      }
    }

    console.log('');

    // ========== CREATE SAMPLE ORDERS ==========
    const rider1Profile = await prisma.riderProfile.findUnique({
      where: { userId: rider1User.id }
    });

    const rider2Profile = await prisma.riderProfile.findUnique({
      where: { userId: rider2User.id }
    });

    // Check if orders already exist
    const existingOrders = await prisma.order.count();
    
    if (existingOrders === 0) {
      // Create some pending orders
      await prisma.order.create({
        data: {
          customerId: createdCustomers[0].id,
          status: 'PENDING',
          priority: 'HIGH',
          totalAmount: 500,
          paidAmount: 0,
          paymentStatus: 'NOT_PAID',
          paymentMethod: 'CASH',
          notes: 'Urgent delivery needed'
        }
      });

      // Create an assigned order
      await prisma.order.create({
        data: {
          customerId: createdCustomers[1].id,
          riderId: rider1Profile.id,
          status: 'ASSIGNED',
          priority: 'NORMAL',
          totalAmount: 750,
          paidAmount: 0,
          paymentStatus: 'NOT_PAID',
          paymentMethod: 'CASH'
        }
      });

      // Create an in-progress order
      await prisma.order.create({
        data: {
          customerId: createdCustomers[2].id,
          riderId: rider2Profile.id,
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          totalAmount: 250,
          paidAmount: 0,
          paymentStatus: 'NOT_PAID',
          paymentMethod: 'CASH'
        }
      });

      // Create a delivered order
      await prisma.order.create({
        data: {
          customerId: createdCustomers[3].id,
          riderId: rider1Profile.id,
          status: 'DELIVERED',
          priority: 'NORMAL',
          totalAmount: 1000,
          paidAmount: 1000,
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          deliveredAt: new Date()
        }
      });

      // Create another delivered order with partial payment
      await prisma.order.create({
        data: {
          customerId: createdCustomers[4].id,
          riderId: rider2Profile.id,
          status: 'DELIVERED',
          priority: 'LOW',
          totalAmount: 500,
          paidAmount: 200,
          paymentStatus: 'PARTIAL',
          paymentMethod: 'CASH',
          deliveredAt: new Date(Date.now() - 86400000) // 1 day ago
        }
      });

      console.log('✅ Sample orders created (5 orders)');
    } else {
      console.log(`ℹ️  Orders already exist (${existingOrders} orders)`);
    }

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('👨‍💼 ADMIN:');
    console.log('   Email: admin@smartsupply.com');
    console.log('   Password: test123');
    console.log('');
    console.log('🏍️  RIDER 1:');
    console.log('   Email: rider1@smartsupply.com');
    console.log('   Password: test123');
    console.log('   Name: Ahmed Khan');
    console.log('');
    console.log('🏍️  RIDER 2:');
    console.log('   Email: rider2@smartsupply.com');
    console.log('   Password: test123');
    console.log('   Name: Hassan Ali');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📊 Sample Data Created:');
    console.log(`   • 1 Admin user`);
    console.log(`   • 2 Riders`);
    console.log(`   • 5 Customers`);
    console.log(`   • 5 Sample orders (various statuses)`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
