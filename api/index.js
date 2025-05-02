// Load environment variables first
require('../dotenv.js');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://heartwork-frontend.vercel.app', process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add debug middleware for authentication requests
app.use('/api/auth', (req, res, next) => {
  console.log(`Auth request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
  socketTimeoutMS: 45000 // Increase socket timeout to 45 seconds
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        message: "Backend API is working!",
        timestamp: new Date(),
        status: "success"
    });
});

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/gallery', require('../routes/gallery'));
app.use('/api/chat', require('../routes/chat'));
app.use('/api/notes', require('../routes/notes'));
app.use('/api/todos', require('../routes/todos'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Export the Express API
module.exports = app; 