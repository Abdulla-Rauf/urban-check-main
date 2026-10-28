import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDatabase = async () => {
  try {
    const mongoUri = config.database.mongoUri;
    
    mongoose.connection.on('connected', () => {
      console.log('📦 MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.warn('⚠️ MongoDB connection warning:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Attempting reconnection...');
    });

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    return mongoose.connection;
  } catch (error) {
    console.warn('ℹ️ Remote MongoDB currently unreachable. Resilient local persistence active for admin & catalog:', error.message);
  }
};
