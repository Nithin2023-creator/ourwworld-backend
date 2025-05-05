const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for push subscription
const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: String,
  expirationTime: Number,
  keys: {
    p256dh: String,
    auth: String
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user1', 'user2'],
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Push notification subscriptions
  pushSubscriptions: {
    type: [pushSubscriptionSchema],
    default: []
  },
  // User notification preferences
  notificationPreferences: {
    newNotes: {
      type: Boolean,
      default: true
    },
    newGalleryImages: {
      type: Boolean,
      default: true
    },
    newTodos: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 