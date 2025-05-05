const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Gallery = require('../models/Gallery');
const User = require('../models/User');
const auth = require('../middleware/auth');
let webPush;

// Try to load web-push library
try {
  webPush = require('web-push');
} catch (error) {
  console.error('Web Push library not available for Gallery route:', error.message);
}

// Store a reference to the io instance (will be set by server.js)
let io;

// Set the io instance for broadcasting gallery updates
router.setIo = function(ioInstance) {
  io = ioInstance;
  console.log('Socket.io instance set for gallery routes');
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get all images
router.get('/images', auth, async (req, res) => {
  try {
    const images = await Gallery.find()
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username');
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload image
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'heartwork',
      resource_type: 'auto'
    });

    const image = new Gallery({
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      uploadedBy: req.user._id,
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    });

    await image.save();
    
    // Broadcast the new image via Socket.io
    if (io) {
      io.emit('newGalleryImage', image);
      console.log('Broadcast new gallery image to all clients via Socket.io');
    }
    
    // Send push notifications to all users who have subscribed
    if (webPush) {
      sendPushNotificationsForNewImage(image);
    }
    
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete image
router.delete('/images/:id', auth, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.cloudinaryId);
    
    // Delete from database using findByIdAndDelete
    await Gallery.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to send push notifications for new gallery images
async function sendPushNotificationsForNewImage(image) {
  try {
    // Find all users with push subscriptions who have enabled gallery notifications
    const users = await User.find({
      'pushSubscriptions.0': { $exists: true },  // At least one push subscription
      'notificationPreferences.newGalleryImages': true   // Has enabled gallery notifications
    });
    
    if (users.length === 0) {
      console.log('No users with push subscriptions found for gallery');
      return;
    }
    
    console.log(`Sending push notifications for new gallery image to ${users.length} users`);
    
    // Format notification payload
    const payload = JSON.stringify({
      title: 'New Photo Added',
      body: image.description || 'A new photo was added to the gallery',
      icon: image.imageUrl || '/logo192.png',
      tag: 'new-gallery-image',
      url: '/gallery',
      actions: [
        { action: 'view', title: 'View Photo' }
      ]
    });
    
    // Send to all users' subscriptions
    const notificationPromises = [];
    
    for (const user of users) {
      for (const subscription of user.pushSubscriptions) {
        try {
          notificationPromises.push(
            webPush.sendNotification(subscription, payload)
              .catch(error => {
                // Handle invalid subscriptions - will be cleaned up later
                console.error(`Push error for user ${user._id}:`, error);
                
                // If subscription is no longer valid, mark for removal
                if (error.statusCode === 404 || error.statusCode === 410) {
                  // Could implement a cleanup process here
                }
                return null;
              })
          );
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
    }
    
    await Promise.all(notificationPromises);
    console.log('Push notifications for new gallery image sent successfully');
  } catch (error) {
    console.error('Error sending push notifications for new gallery image:', error);
  }
}

module.exports = router; 