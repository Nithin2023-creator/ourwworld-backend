/**
 * Generate VAPID Keys for Web Push Notifications
 * 
 * This script generates a set of VAPID keys for use with the Web Push API.
 * 
 * Run: node scripts/generate-vapid-keys.js
 * 
 * Add these keys to your .env file:
 * VAPID_PUBLIC_KEY=<publicKey>
 * VAPID_PRIVATE_KEY=<privateKey>
 * VAPID_SUBJECT=mailto:your-email@example.com
 */

const webpush = require('web-push');

try {
  // Generate VAPID keys
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('\n===== VAPID KEYS FOR WEB PUSH NOTIFICATIONS =====\n');
  console.log('Public Key:');
  console.log(vapidKeys.publicKey);
  console.log('\nPrivate Key:');
  console.log(vapidKeys.privateKey);
  
  console.log('\n===== ADD THESE TO YOUR .ENV FILE =====\n');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('VAPID_SUBJECT=mailto:your-email@example.com');
  
  console.log('\n===== FOR FRONTEND .ENV =====\n');
  console.log(`REACT_APP_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  
  console.log('\nThese keys should be kept secure and used consistently across deployments.');
  console.log('Replace "your-email@example.com" with a valid contact email.');
} catch (error) {
  console.error('Error generating VAPID keys:');
  console.error(error);
  console.log('\nPlease make sure you have installed the web-push package:');
  console.log('npm install web-push');
} 