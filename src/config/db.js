const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure SRV records can be resolved on all networks/ISPs
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_) {}

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
};

module.exports = connectDB;
