const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Gallery = require('../models/Gallery');
const auth = require('../middleware/auth');

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
    
    // Broadcast the new image
    if (io) {
      io.emit('newGalleryImage', image);
      console.log('Broadcast new gallery image to all clients');
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

module.exports = router; 