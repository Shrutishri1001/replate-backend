const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const checkAdmin = async () => {
    try {
        await connectDB();
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`Admin found: ${admin.email}`);
        } else {
            console.log('No admin user found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const checkAdmin = async () => {
    try {
        await connectDB();
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`Admin found: ${admin.email}`);
        } else {
            console.log('No admin user found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
