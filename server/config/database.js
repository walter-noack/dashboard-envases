const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Reutilizar conexión existente (importante para Lambda)
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB: usando conexión existente');
    return;
  }

  try {
    console.log('MongoDB: conectando...');

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error conectando a MongoDB: ${error.message}`);
    // No usar process.exit en Lambda
    throw error;
  }
};

module.exports = connectDB;