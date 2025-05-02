// Load environment variables
require('./dotenv.js');
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heartwork', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Create a test user
async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }
    
    const testUser = new User({
      username: 'testuser',
      password: 'password123', // This will be hashed by the pre-save hook
      role: 'user1'
    });
    
    await testUser.save();
    console.log('Test user created successfully');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

createTestUser(); 