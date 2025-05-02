const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');

// Store a reference to the io instance (will be set by server.js)
let io;

// Set the io instance for broadcasting todo updates
router.setIo = function(ioInstance) {
  io = ioInstance;
  console.log('Socket.io instance set for todos routes');
};

// Function to broadcast task updates to all clients
const broadcastTodoUpdates = async () => {
  try {
    // Get all todos
    const allTodos = await Todo.find().sort({ createdAt: -1 });
    
    // Broadcast to all connected clients
    if (io) {
      io.emit('taskUpdate', allTodos);
      console.log('Broadcast task update to all clients');
    }
  } catch (error) {
    console.error('Error broadcasting todo updates:', error);
  }
};

// Default todos for each animal
const DEFAULT_TODOS = {
  panda: [
    { text: 'Breakfast', isDefault: true },
    { text: 'Lunch', isDefault: true },
    { text: 'Walk', isDefault: true },
    { text: 'Dinner', isDefault: true }
  ],
  bear: [
    { text: 'Breakfast', isDefault: true },
    { text: 'Lunch', isDefault: true },
    { text: 'Walk', isDefault: true },
    { text: 'Dinner', isDefault: true }
  ]
};

// Helper function to check if todos need to be reset (once per day)
const shouldResetTodos = (lastReset) => {
  if (!lastReset) return true;
  
  const now = new Date();
  const last = new Date(lastReset);
  
  // Check if it's a different day
  return now.getDate() !== last.getDate() ||
         now.getMonth() !== last.getMonth() ||
         now.getFullYear() !== last.getFullYear();
};

// Reset default todos - this will be called when fetching todos
const resetDefaultTodos = async (animal) => {
  try {
    // Find default todos for this animal
    const defaultTodos = await Todo.find({ animal, isDefault: true });
    
    // If no default todos exist or they were last reset on a previous day, create/reset them
    if (defaultTodos.length === 0) {
      // Create default todos for this animal
      await Promise.all(DEFAULT_TODOS[animal].map(todo => 
        new Todo({
          ...todo,
          animal,
          completed: false,
          lastReset: new Date()
        }).save()
      ));
      
      // Broadcast changes
      await broadcastTodoUpdates();
      return true;
    } else if (defaultTodos.length > 0 && shouldResetTodos(defaultTodos[0].lastReset)) {
      // Reset existing default todos
      await Promise.all(defaultTodos.map(todo => 
        Todo.findByIdAndUpdate(todo._id, {
          completed: false,
          lastReset: new Date()
        })
      ));
      
      // Broadcast changes
      await broadcastTodoUpdates();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error resetting default todos:', error);
    return false;
  }
};

// Get all todos
router.get('/', auth, async (req, res) => {
  try {
    // Create a filter object for optional filtering by animal
    const filter = {};
    
    // Add animal filter if provided in query
    if (req.query.animal) {
      filter.animal = req.query.animal;
      
      // Reset default todos if needed for this animal
      await resetDefaultTodos(req.query.animal);
    } else {
      // Check and reset default todos for both animals if no specific animal is requested
      await resetDefaultTodos('panda');
      await resetDefaultTodos('bear');
    }
    
    // Get todos with optional filter
    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error('Error getting todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new todo
router.post('/', auth, async (req, res) => {
  try {
    const { text, animal, isDefault = false } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    const todo = new Todo({
      text,
      animal: animal || 'panda', // Default to panda if not specified
      completed: false,
      isDefault
    });
    
    await todo.save();
    
    // Broadcast todo updates to all clients after adding
    await broadcastTodoUpdates();
    
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a todo
router.put('/:id', auth, async (req, res) => {
  try {
    const { completed, text } = req.body;
    const updateData = {};
    
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;
    
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Broadcast todo updates to all clients after updating
    await broadcastTodoUpdates();
    
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only allow deletion of non-default todos
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Only delete if it's not a default todo
    if (!todo.isDefault) {
      await Todo.findByIdAndDelete(req.params.id);
      
      // Broadcast todo updates to all clients after deleting
      await broadcastTodoUpdates();
      
      return res.json({ message: 'Todo deleted' });
    } else {
      return res.status(403).json({ message: 'Cannot delete default todos' });
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manually reset default todos for testing
router.post('/reset-defaults', auth, async (req, res) => {
  try {
    console.log('Reset-defaults endpoint called with body:', req.body);
    const { animal } = req.body;
    
    if (!animal || !['panda', 'bear'].includes(animal)) {
      console.log('Invalid animal in request:', animal);
      return res.status(400).json({ message: 'Valid animal (panda or bear) is required' });
    }
    
    console.log(`Resetting default todos for ${animal}`);
    
    // Find and delete any existing default todos for this animal
    const deleteResult = await Todo.deleteMany({ animal, isDefault: true });
    console.log('Delete result:', deleteResult);
    
    // Create fresh default todos
    const newDefaultTodos = await Promise.all(DEFAULT_TODOS[animal].map(todo => 
      new Todo({
        ...todo,
        animal,
        completed: false,
        lastReset: new Date()
      }).save()
    ));
    
    console.log(`Created ${newDefaultTodos.length} new default todos for ${animal}`);
    
    // Broadcast todo updates to all clients after resetting
    await broadcastTodoUpdates();
    
    res.json({ 
      message: `Default todos for ${animal} have been reset`,
      todos: newDefaultTodos
    });
  } catch (error) {
    console.error('Error resetting todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
