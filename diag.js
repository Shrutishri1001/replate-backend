const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodshare');
        console.log('Connected to DB');

        const acceptedDonations = await Donation.find({ status: 'accepted' }).populate('donor');
        console.log('Total Accepted Donations:', acceptedDonations.length);

        acceptedDonations.forEach(d => {
            console.log(`- Food: ${d.foodName}, City: ${d.city}, DonorCity: ${d.donor?.city}, AcceptedBy: ${d.acceptedBy}`);
        });

        const volunteers = await User.find({ role: 'volunteer' });
        console.log('Volunteers:', volunteers.length);
        volunteers.forEach(v => {
            console.log(`- Name: ${v.fullName}, Email: ${v.email}, City: ${v.city}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
