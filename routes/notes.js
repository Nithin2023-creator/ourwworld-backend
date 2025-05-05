const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

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
    
    // Broadcast the new note
    if (io) {
      io.emit('newNote', note);
      console.log('Broadcast new note to all clients');
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

module.exports = router; 