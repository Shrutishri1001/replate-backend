const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(connUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;