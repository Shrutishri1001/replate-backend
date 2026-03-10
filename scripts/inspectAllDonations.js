const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('../models/Donation');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const inspectAllDonations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const donations = await Donation.find({});
        console.log(`Total Donations: ${donations.length}`);
        donations.forEach(d => {
            console.log(`ID: ${d._id} | Status: ${d.status} | Food: ${d.foodName} | AcceptedBy: ${d.acceptedBy} | AssignedTo: ${d.assignedTo}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectAllDonations();
