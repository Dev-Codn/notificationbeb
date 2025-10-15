import webPush from 'web-push';

console.log('Generating VAPID keys...\n');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nAlso add:');
console.log('VAPID_SUBJECT=mailto:your-email@example.com (or your website URL)');

