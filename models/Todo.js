const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  animal: {
    type: String,
    enum: ['panda', 'bear'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  lastReset: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Todo', todoSchema);