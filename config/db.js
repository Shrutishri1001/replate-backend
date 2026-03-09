const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let connUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    // Ensure we are connecting to 'foodshare' database and not the default 'test'
    if (connUri && !connUri.includes('/foodshare')) {
      // If it's a srv connection string, we insert 'foodshare' before '?'
      if (connUri.includes('?')) {
        connUri = connUri.replace('?', 'foodshare?');
      } else {
        // Append if no query params
        connUri = connUri.endsWith('/') ? `${connUri}foodshare` : `${connUri}/foodshare`;
      }
    }

    await mongoose.connect(connUri);
    console.log(`MongoDB connected successfully to: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;