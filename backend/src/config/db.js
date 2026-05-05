// src/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Modern Mongoose doesn't need the extra options!
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure code
    process.exit(1); 
  }
};

export default connectDB;