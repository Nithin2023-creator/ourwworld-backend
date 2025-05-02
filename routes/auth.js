const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt received:', req.body);
    
    // Check if request body has password
    if (!req.body || !req.body.password) {
      console.log('Missing password in request');
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const { password } = req.body;
    
    // Find all users and check password match
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    let matchedUser = null;
    
    for (const user of users) {
      try {
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      } catch (passwordError) {
        console.error('Error comparing password:', passwordError);
      }
    }

    if (!matchedUser) {
      console.log('No user matched the provided password');
      return res.status(401).json({ message: 'Invalid password' });
    }

    console.log(`User matched: ${matchedUser.username}`);
    
    // Update last login
    matchedUser.lastLogin = Date.now();
    await matchedUser.save();

    const token = jwt.sign(
      { id: matchedUser._id, role: matchedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful, sending response');
    
    res.json({
      token,
      user: {
        id: matchedUser._id,
        username: matchedUser.username,
        role: matchedUser.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify token route
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 