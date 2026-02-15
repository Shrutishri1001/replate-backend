module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./test/setup.js'],
    setupFiles: ['./test/env.js'],
    testTimeout: 30000,
    verbose: true,
    silent: false, // Set to true to suppress console.log from app
    testPathIgnorePatterns: ['/node_modules/', '/test/manual/'],
};
