const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const promoteToAdmin = async () => {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address: node promoteToAdmin.js user@example.com');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');

        const user = await User.findOne({ email });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        user.role = 'admin';
        user.verificationStatus = 'approved';
        user.status = 'active';

        await user.save();

        console.log(`Success! User ${email} is now an ADMIN and has been approved.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

promoteToAdmin();
