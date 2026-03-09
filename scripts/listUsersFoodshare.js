const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const listUsersFoodshare = async () => {
    try {
        // Force connection to foodshare
        await mongoose.connect('mongodb://127.0.0.1:27017/foodshare');
        console.log("Connected to foodshare database");

        const users = await User.find({}, 'email role fullName');
        console.log('Registered Users in foodshare:');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsersFoodshare();
