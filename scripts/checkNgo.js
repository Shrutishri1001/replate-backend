const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const checkNgo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const ngo = await User.findById('698b0e8d8d88644d712dede8');
        console.log(JSON.stringify(ngo, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkNgo();
