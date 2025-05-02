require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heartwork', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing users
    await User.deleteMany({});

    // Create initial users
    const users = [
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

    for (const user of users) {
      const newUser = new User(user);
      await newUser.save();
    }

    console.log('Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();