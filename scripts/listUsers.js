const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const listUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({}, 'email role fullName');
        console.log('Registered Users:');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
