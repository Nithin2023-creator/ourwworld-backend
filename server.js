// Load environment variables from our custom file
require('./dotenv.js');
// Original dotenv config
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const Message = require('./models/Message');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS allowing all origins
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Access-Control-Allow-Headers'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add debug middleware for authentication requests
app.use('/api/auth', (req, res, next) => {
  console.log(`Auth request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Project:Florencemidhebaramvesam@project.tbx2krn.mongodb.net/heartwork', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('Socket connection rejected: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log('Socket authenticated successfully for user:', decoded.id);
    next();
  } catch (err) {
    console.log('Socket authentication failed:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id);

  // Join a room for task updates
  socket.join('todos-room');
  
  socket.on('sendMessage', async (message) => {
    try {
      // Get user details
      const user = await User.findById(socket.user.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Encrypt message before storing
      const encryptedText = CryptoJS.AES.encrypt(
        message.text,
        process.env.ENCRYPTION_KEY
      ).toString();

      // Store encrypted message in database
      const newMessage = new Message({
        sender: socket.user.id,
        encryptedText,
        timestamp: message.timestamp
      });

      await newMessage.save();

      // Format message for sending with consistent ID handling
      const senderId = socket.user.id.toString();
      const messageToSend = {
        _id: newMessage._id,
        text: message.text,
        sender: senderId,
        senderName: user.username,
        timestamp: message.timestamp,
        isCurrentUser: true
      };

      // Broadcast message to all clients
      io.emit('newMessage', messageToSend);
      console.log('Message sent:', messageToSend);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const chatRoutes = require('./routes/chat');
const notesRoutes = require('./routes/notes');
const todosRoutes = require('./routes/todos');
const testRoutes = require('./routes/testRoute');

// Set io instance for todos routes
todosRoutes.setIo(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api', testRoutes);

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 