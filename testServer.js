require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');

// Test server to diagnose login issues
const app = express();

// Enable CORS with permissive settings
app.use(cors({
  origin: ['http://localhost:3000', 'https://heartwork-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON requests
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

// Login test route
app.post('/test-login', async (req, res) => {
  try {
    console.log('Test login request received:', req.body);
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heartwork', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    }
    
    // Find users and test password
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    // List usernames for debugging
    console.log('User list:', users.map(u => u.username));
    
    let matchedUser = null;
    for (const user of users) {
      try {
        const isMatch = await user.comparePassword(password);
        console.log(`Password match for ${user.username}: ${isMatch}`);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      } catch (err) {
        console.error(`Error comparing password for ${user.username}:`, err);
      }
    }
    
    if (matchedUser) {
      res.json({ 
        message: 'Login successful',
        user: {
          username: matchedUser.username,
          role: matchedUser.role
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
});

// Create/check users route
app.get('/check-users', async (req, res) => {
  try {
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heartwork', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
    
    // Check if users exist
    const users = await User.find({});
    
    if (users.length === 0) {
      // Create default users
      const defaultUsers = [
        {
          username: '🐻',
          password: 'panda',
          role: 'user1'
        },
        {
          username: '🐼',
          password: 'bear',
          role: 'user2'
        }
      ];
      
      for (const userData of defaultUsers) {
        const user = new User(userData);
        await user.save();
      }
      
      res.json({ message: 'Default users created', count: defaultUsers.length });
    } else {
      res.json({ 
        message: 'Users already exist', 
        count: users.length,
        users: users.map(u => ({ username: u.username, role: u.role }))
      });
    }
  } catch (error) {
    console.error('Error checking/creating users:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`- Test login: POST http://localhost:${PORT}/test-login`);
  console.log(`- Check users: GET http://localhost:${PORT}/check-users`);
}); 