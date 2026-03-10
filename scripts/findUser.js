const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const findUser = async () => {
    try {
        await connectDB();
        const email = 'parvathy@gmail.com';
        const user = await User.findOne({ email });
        if (user) {
            console.log('User found:');
            console.log(JSON.stringify({
                email: user.email,
                role: user.role,
                status: user.status,
                verificationStatus: user.verificationStatus,
                fullName: user.fullName
            }, null, 2));
        } else {
            console.log(`User with email ${email} not found.`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findUser();
