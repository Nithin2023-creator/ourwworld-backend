const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const CryptoJS = require('crypto-js');

// Get chat history
router.get('/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username');

    // Decrypt messages
    const decryptedMessages = messages.map(message => ({
      ...message.toObject(),
      text: CryptoJS.AES.decrypt(
        message.encryptedText,
        process.env.ENCRYPTION_KEY
      ).toString(CryptoJS.enc.Utf8)
    }));

    res.json(decryptedMessages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/messages', auth, async (req, res) => {
  try {
    const { text } = req.body;

    // Encrypt message
    const encryptedText = CryptoJS.AES.encrypt(
      text,
      process.env.ENCRYPTION_KEY
    ).toString();

    const message = new Message({
      sender: req.user._id,
      encryptedText
    });

    await message.save();

    res.status(201).json({
      ...message.toObject(),
      text: text // Send decrypted text back to sender
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 