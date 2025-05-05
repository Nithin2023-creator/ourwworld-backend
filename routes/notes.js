const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');
let webPush;

// Try to load web-push library
try {
  webPush = require('web-push');
} catch (error) {
  console.error('Web Push library not available for Notes route:', error.message);
}

// Store a reference to the io instance (will be set by server.js)
let io;

// Set the io instance for broadcasting note updates
router.setIo = function(ioInstance) {
  io = ioInstance;
  console.log('Socket.io instance set for notes routes');
};

// Get all notes
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new note
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const note = new Note({ text });
    await note.save();
    
    // Broadcast the new note via Socket.io
    if (io) {
      io.emit('newNote', note);
      console.log('Broadcast new note to all clients via Socket.io');
    }
    
    // Send push notifications to all users who have subscribed
    if (webPush) {
      sendPushNotificationsForNewNote(note);
    }
    
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id, 
      { text }, 
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to send push notifications for new notes
async function sendPushNotificationsForNewNote(note) {
  try {
    // Find all users with push subscriptions who have enabled note notifications
    const users = await User.find({
      'pushSubscriptions.0': { $exists: true },  // At least one push subscription
      'notificationPreferences.newNotes': true   // Has enabled note notifications
    });
    
    if (users.length === 0) {
      console.log('No users with push subscriptions found for notes');
      return;
    }
    
    console.log(`Sending push notifications for new note to ${users.length} users`);
    
    // Format notification payload
    const payload = JSON.stringify({
      title: 'New Sticky Note Added',
      body: note.text.substring(0, 50) + (note.text.length > 50 ? '...' : ''),
      icon: '/logo192.png',
      tag: 'new-note',
      url: '/notes'
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
    console.log('Push notifications for new note sent successfully');
  } catch (error) {
    console.error('Error sending push notifications for new note:', error);
  }
}

module.exports = router; 