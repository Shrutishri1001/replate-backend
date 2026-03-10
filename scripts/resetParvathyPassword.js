const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const resetPassword = async () => {
    try {
        await connectDB();
        const email = 'parvathy@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.password = 'admin123';
        await user.save();

        console.log(`Password reset successfully for ${email}`);
        console.log(`New Password: admin123`);
        process.exit(0);
    } catch (err) {
        console.error('Error resetting password:', err.message);
        process.exit(1);
    }
};

resetPassword();
