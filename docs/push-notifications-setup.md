# Heartwork Mobile Push Notifications Setup Guide

This guide explains how to set up and use the mobile push notifications feature in the Heartwork application.

## Overview

Heartwork now supports two types of notifications:
1. **Browser Notifications**: Real-time notifications that appear in the browser while the user is using the device
2. **Push Notifications**: Notifications that are sent to mobile devices even when the browser is closed

## Prerequisites

- Node.js 14+ installed
- Web-push library (`npm install web-push`)
- HTTPS environment (required for push notifications in production)
- A mobile device with Chrome, Firefox, or other browser that supports Push API

## Server-Side Setup

### 1. Install web-push

```bash
cd heartwork-backend-main
npm install web-push --save
```

### 2. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications.

```bash
node scripts/generate-vapid-keys.js
```

This will output the VAPID keys to add to your environment variables.

### 3. Update Environment Variables

Add the generated VAPID keys to your `.env` file:

```
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:your-email@example.com
```

Also add the public key to your frontend `.env` file:

```
REACT_APP_VAPID_PUBLIC_KEY=<your-public-key>
```

### 4. Update User Model

The User model has been updated to store push subscriptions. No action needed if you're using the latest schema.

## Client-Side Setup

### 1. Service Worker Registration

The app already registers a service worker at `public/service-worker.js`. This service worker handles push notifications.

### 2. Testing Push Notifications

1. Open the application on a mobile device
2. Login with your credentials
3. Toggle "Mobile" button in the navbar to enable push notifications
4. Accept the browser permission prompt
5. Create a new note or upload a new image to test notifications

## Development vs. Production

- **Development**: Push notifications work on localhost with supported browsers
- **Production**: Requires HTTPS with a valid SSL certificate

## Troubleshooting

### Notifications Not Working

1. **Check Browser Support**: Ensure your browser supports the Push API and Service Workers
2. **Check Permissions**: Verify notification permissions are granted
3. **Check Service Worker**: Make sure the service worker is registered correctly
4. **Check Environment**: Push notifications require a secure context (HTTPS or localhost)
5. **Check Console Logs**: Look for errors in both frontend and backend console logs

### Common Errors

- `DOMException: Subscription failed - no active Service Worker`: Ensure the service worker is registered properly
- `Error: Registration failed - permission denied`: User denied notification permission
- `Error: Registration failed - push service error`: Issue with the push service, may need to retry

## Mobile PWA Installation

For the best experience, users should install the Heartwork app as a PWA:

1. **Android**: Click the "Add to Home Screen" prompt or use the browser menu
2. **iOS**: Use the Safari share button and select "Add to Home Screen"

## Security Considerations

- VAPID keys should be kept secure and not exposed in client-side code
- The `userVisibleOnly: true` flag ensures notifications are always visible to users
- Subscription objects contain sensitive data and should be stored securely

## Notification Types

The application currently sends push notifications for:

1. New sticky notes
2. New gallery images

Each user can customize their notification preferences in the database.

## Additional Resources

- [Web Push Notifications Guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Libraries (web-push-libs)](https://github.com/web-push-libs) 