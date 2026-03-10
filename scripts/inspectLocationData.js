const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('../models/Donation');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const inspectData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("--- DONATIONS ---");
        const donations = await Donation.find({ status: 'accepted' }).populate('donor');
        for (const d of donations) {
            console.log(`Donation: ${d.foodName}`);
            console.log(`- d.location: ${JSON.stringify(d.location)}`);
            console.log(`- donor.location: ${JSON.stringify(d.donor?.location)}`);
        }

        console.log("\n--- USERS ---");
        const users = await User.find({ role: { $in: ['volunteer', 'ngo'] } });
        for (const u of users) {
            console.log(`User: ${u.fullName} (${u.role})`);
            console.log(`- location: ${JSON.stringify(u.location)}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectData();
