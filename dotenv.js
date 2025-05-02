// This file manually sets environment variables since we can't create .env files
process.env.JWT_SECRET = 'heartworkSecretKey2024';
process.env.MONGODB_URI = 'mongodb+srv://Project:Florencemidhebaramvesam@project.tbx2krn.mongodb.net/heartwork';
process.env.ENCRYPTION_KEY = 'heartworkEncryptionKey2024';
process.env.CLIENT_URL = 'http://localhost:3000';

console.log('Environment variables set:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '******' : 'not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI.substring(0, 20) + '...');
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '******' : 'not set');
console.log('CLIENT_URL:', process.env.CLIENT_URL); 