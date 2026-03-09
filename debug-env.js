require('dotenv').config();
console.log('--- ENV DEBUG ---');
console.log('PWD:', process.cwd());
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGO_URI) {
    console.log('MONGO_URI prefix:', process.env.MONGO_URI.substring(0, 10));
}
console.log('-----------------');
