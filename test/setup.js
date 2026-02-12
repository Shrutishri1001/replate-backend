const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect Mongoose to the in-memory database
    // This connection is shared by all models in the application
    await mongoose.connect(uri);
});

afterEach(async () => {
    // Clear all collections after each test to ensure clean state
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    }
});

afterAll(async () => {
    // Close connection and stop memory server
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
