const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const checkAravindSchedule = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'vol2@foodshare.com' });
        console.log('Monday schedule:', JSON.stringify(user.volunteerProfile.availabilitySchedule.mon, null, 2));
        console.log('Current Day (0-6):', new Date().getDay());
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAravindSchedule();
